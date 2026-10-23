import Redis from "ioredis";

// Thin Redis wrapper. Methods THROW on failure on purpose: callers decide whether
// a cache failure is tolerable (fall back to the database) -- the cache is never
// allowed to answer "yes, authenticated" by itself when it is unhealthy.
export class RedisCacheProvider {
  constructor({ host, port, password, tls = false, name = "redis" }) {
    this.name = name;
    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      tls: tls ? {} : undefined,
      lazyConnect: true,
      // Fail fast instead of queueing commands forever while Redis is down.
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      retryStrategy: (times) => Math.min(times * 500, 5000),
    });
    this._lastLog = 0;
    this.client.on("error", (err) => {
      // Rate-limit noisy reconnect errors to one line per 10s; never log credentials.
      if (Date.now() - this._lastLog > 10_000) {
        this._lastLog = Date.now();
        console.warn(`[${this.name}] connection error: ${err.code || err.message}`);
      }
    });
    this.client.on("ready", () => console.log(`[${this.name}] ready`));
    this.client.connect().catch(() => {});
  }
  get isReady() {
    return this.client.status === "ready";
  }
  async get(key) {
    return this.client.get(key);
  }
  async set(key, value, ttlSec) {
    if (!Number.isInteger(ttlSec) || ttlSec <= 0) throw new Error("ttl required");
    return this.client.set(key, value, "EX", ttlSec);
  }
  async del(...keys) {
    return this.client.del(...keys);
  }
  async scanDel(pattern) {
    let cursor = "0";
    let removed = 0;
    do {
      const [next, keys] = await this.client.scan(cursor, "MATCH", pattern, "COUNT", 200);
      cursor = next;
      if (keys.length) removed += await this.client.del(...keys);
    } while (cursor !== "0");
    return removed;
  }
  // Atomic counter with a TTL set on first increment (used by rate limiting).
  async incrWithTtl(key, ttlMs) {
    const res = await this.client
      .multi()
      .incr(key)
      .pexpire(key, ttlMs, "NX")
      .pttl(key)
      .exec();
    const count = res[0][1];
    const pttl = res[2][1];
    return { count, ttlMs: pttl > 0 ? pttl : ttlMs };
  }
  async ping() {
    return this.client.ping();
  }
  async quit() {
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}
