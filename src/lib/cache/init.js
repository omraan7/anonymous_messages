import { RedisCacheProvider } from "../../pkg/cache/redis";
import { env } from "../config/env";

export const initCache = new RedisCacheProvider({
  REDIS_HOST: env.redis.redisHost,
  REDIS_PORT: env.redis.redisPort,
  REDIS_PASSWORD: env.redis.redisPass || "",
});