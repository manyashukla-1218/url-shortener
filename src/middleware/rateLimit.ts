import { NextFunction, Request, Response } from "express";
import { redis } from "../cache";

// Fixed-window limiter: INCR a per-IP key, set expiry on first hit.
// Fails open: if Redis is down we let traffic through instead of taking the API down.
export function rateLimit(name: string, limitPerMinute: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (limitPerMinute <= 0) return next();
    const window = Math.floor(Date.now() / 60000);
    const key = `rl:${name}:${req.ip}:${window}`;
    try {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, 60);
      res.setHeader("X-RateLimit-Limit", limitPerMinute);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, limitPerMinute - count));
      if (count > limitPerMinute) {
        return res.status(429).json({ error: "Too many requests" });
      }
    } catch {
      // fail open
    }
    next();
  };
}
