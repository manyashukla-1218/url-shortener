import cluster from "node:cluster";
import os from "node:os";
import express from "express";
import { config } from "./config";
import { rateLimit } from "./middleware/rateLimit";
import shortenRoutes from "./routes/shorten";
import redirectRoutes from "./routes/redirect";
import { pool } from "./db";
import { redis } from "./cache";

const workers = Number(process.env.WORKERS ?? Math.min(os.cpus().length, 4));

function startServer() {
  const app = express();
  app.set("trust proxy", true);
  app.use(express.json({ limit: "10kb" }));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/shorten", rateLimit("shorten", config.rateLimitShorten));
  app.use(shortenRoutes);
  app.get("/:code", rateLimit("redirect", config.rateLimitRedirect));
  app.use(redirectRoutes);

  const server = app.listen(config.port, () =>
    console.log(`worker ${process.pid} listening on :${config.port} (cache ${config.cacheEnabled ? "on" : "off"})`)
  );

  const shutdown = async () => {
    server.close();
    await pool.end();
    redis.disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

if (cluster.isPrimary && workers > 1) {
  console.log(`primary ${process.pid} starting ${workers} workers`);
  let shuttingDown = false;
  for (let i = 0; i < workers; i++) cluster.fork();

  cluster.on("exit", (w) => {
    if (shuttingDown) return;
    console.log(`worker ${w.process.pid} died, restarting`);
    cluster.fork();
  });

  const stop = () => {
    shuttingDown = true;
    for (const w of Object.values(cluster.workers ?? {})) w?.process.kill("SIGTERM");
    setTimeout(() => process.exit(0), 2000);
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
} else {
  startServer();
}