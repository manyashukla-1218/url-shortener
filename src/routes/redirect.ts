import { Router } from "express";
import { pool } from "../db";
import { redis } from "../cache";
import { config } from "../config";

const router = Router();

// Cache-aside: Redis -> Postgres -> back into Redis
router.get("/:code", async (req, res) => {
  const { code } = req.params;
  if (!/^[0-9a-zA-Z]{1,12}$/.test(code)) return res.status(404).json({ error: "Not found" });

  try {
    if (config.cacheEnabled) {
      const cached = await redis.get(`url:${code}`).catch(() => null);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        return res.redirect(302, cached);
      }
    }

    const r = await pool.query("SELECT long_url FROM urls WHERE code = $1", [code]);
    if (r.rowCount === 0) return res.status(404).json({ error: "Not found" });

    const longUrl: string = r.rows[0].long_url;
    if (config.cacheEnabled) {
      redis.set(`url:${code}`, longUrl, "EX", config.cacheTtlSeconds).catch(() => {});
    }
    res.setHeader("X-Cache", "MISS");
    return res.redirect(302, longUrl);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;
