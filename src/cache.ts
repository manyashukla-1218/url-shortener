import Redis from "ioredis";
import { config } from "./config";

export const redis = new Redis(config.redisUrl, { maxRetriesPerRequest: 1 });
redis.on("error", (e) => console.error("redis error:", e.message));
