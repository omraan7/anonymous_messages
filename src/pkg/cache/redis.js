import Redis from "ioredis";
import MaxRetriesPerRequestError from './../../../node_modules/ioredis/built/errors/MaxRetriesPerRequestError.d';
// implement a cache provider using redis for any application that needs caching functionality.
// This provider will allow you to set, get, and delete cache entries in a Redis database.
// It will also handle connection errors and retries.
export class RedisCacheProvider {
  clint;
  constructor(config) {
    this.clint = new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD,
      lazyConnect: true,
      maxloadingRetryTime: 3,
    });
    this.clint.on("error", (err) => {
      if (err instanceof MaxRetriesPerRequestError) {
        console.log("Redis connection error: Max retries exceeded");
      } else {
        console.log("Redis connection error:", err);
      }
    });
    this.clint
      .connect()
      .then(() => {
        console.log("redis connected");
      })
      .catch((err) => {
        console.log("redis connection error", err);
      });
  }
  async set(key, value, ttl) {
    return await this.clint.set(key, value, "EX", ttl);
  }
  async get(key) {
    return await this.clint.get(key);
  }
  async del(key) {
    return await this.clint.del(key);
  }
}
