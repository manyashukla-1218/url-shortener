import { Router } from "express";
import { pool } from "../db";
import { encode } from "../base62";
import { config } from "../config";

const router = Router();

function isValidUrl(raw: unknown): raw is string {
  if (typeof raw !== "string" || raw.length > 2048) return false;
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

router.post("/shorten", async (req, res) => {
  const { url } = req.body ?? {};
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: "Provide a valid http(s) url (max 2048 chars)" });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ins = await client.query("INSERT INTO urls (long_url) VALUES ($1) RETURNING id", [url]);
    const code = encode(BigInt(ins.rows[0].id));
    await client.query("UPDATE urls SET code = $1 WHERE id = $2", [code, ins.rows[0].id]);
    await client.query("COMMIT");
    res.status(201).json({ code, shortUrl: `${config.baseUrl}/${code}`, longUrl: url });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  } finally {
    client.release();
  }
});

export default router;
