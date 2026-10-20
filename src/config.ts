export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? "postgres://app:app@localhost:5432/shortener",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  baseUrl: process.env.BASE_URL ?? "http://localhost:3000",
  cacheTtlSeconds: Number(process.env.CACHE_TTL ?? 86400),
  pgPoolSize: Number(process.env.PG_POOL_SIZE ?? 20),
  // requests per minute per IP. 0 = disabled (use 0 for load tests)
  rateLimitShorten: Number(process.env.RATE_LIMIT_SHORTEN ?? 60),
  rateLimitRedirect: Number(process.env.RATE_LIMIT_REDIRECT ?? 0),
  // set CACHE_ENABLED=false to measure the "before cache" baseline
  cacheEnabled: (process.env.CACHE_ENABLED ?? "true") === "true",
};
