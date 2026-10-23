import { initCache } from "./init";

export const idempotency = () => {
  return async (req, res, next) => {
    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey) {
      return res.status(400).json({ message: "Idempotency key is required" });
    }
    let key = `${req.method}:${req.originalUrl}:${idempotencyKey}`;

    const cache = await initCache.get(key);
    if (cache) {
      res.setHeader("x-Cache", "HIT");
      return res.status(200).json(JSON.parse(cache));
    } else {
      const originalJson = res.json.bind();
      res.json = async (body) => {
      if (res.statusCode>=200 && res.statusCode<300) {
        await initCache.set(key, JSON.stringify(body));
        res.setHeader("x-Cache", "MISS");
      }

        return originalJson(body);
      };
      next();
    }
  };
};
