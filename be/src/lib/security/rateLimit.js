import rateLimit, { MemoryStore } from "express-rate-limit";
import { cache } from "../cache/init.js";
import { env } from "../config/env.js";

// Redis-backed store so limits are shared across instances; if Redis is down it
// transparently falls back to a per-process memory store (limits keep working).
class ResilientStore {
  constructor(prefix) {
    this.prefix = `saraha:v1:rl:${prefix}:`;
    this.memory = new MemoryStore();
  }
  init(options) {
    this.windowMs = options.windowMs;
    this.memory.init(options);
  }
  async increment(key) {
    if (cache?.isReady) {
      try {
        const { count, ttlMs } = await cache.incrWithTtl(this.prefix + key, this.windowMs);
        return { totalHits: count, resetTime: new Date(Date.now() + ttlMs) };
      } catch { /* fall through */ }
    }
    return this.memory.increment(key);
  }
  async decrement(key) { return this.memory.decrement(key); }
  async resetKey(key) {
    this.memory.resetKey(key);
    try { await cache?.del(this.prefix + key); } catch { /* ignore */ }
  }
}

const make = (name, windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: new ResilientStore(name),
    skip: () => env.isTest && process.env.RATE_LIMIT_IN_TEST !== "1",
    handler: (req, res) =>
      res.status(429).json({ message, code: "RATE_LIMITED" }),
  });

export const globalLimiter = make("global", 15 * 60_000, 600, "Too many requests, slow down.");
export const authLimiter = make("auth", 15 * 60_000, 20, "Too many attempts. Try again in a few minutes.");
export const otpLimiter = make("otp", 15 * 60_000, 10, "Too many code requests. Try again later.");
export const messageLimiter = make("msg", 60 * 60_000, 30, "You're sending messages too quickly.");
export const uploadLimiter = make("upload", 60 * 60_000, 20, "Too many uploads. Try again later.");
