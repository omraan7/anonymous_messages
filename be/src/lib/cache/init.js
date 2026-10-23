import { RedisCacheProvider } from "../../pkg/cache/redis.js";
import { env } from "../config/env.js";

// `null` when REDIS_HOST is not configured: every consumer must handle that and
// fall back to MongoDB (sessions) or in-memory (rate limiting).
export const cache = env.redis ? new RedisCacheProvider({ ...env.redis, name: "redis" }) : null;
export const initCache = cache; // backwards-compatible export name
