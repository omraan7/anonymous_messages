import "dotenv/config";
import { env } from "./lib/config/env.js";
import { connectDb, disconnectDb } from "./lib/db/mongose.js";
import { cache } from "./lib/cache/init.js";
import { createApp } from "./app.js";

async function start() {
  await connectDb(); // never accept traffic before the database is reachable
  console.log("[db] connected");

  const app = createApp();
  const server = app.listen(env.port, () =>
    console.log(`[http] listening on :${env.port} (${env.nodeEnv}) prefix=${env.apiPrefix}`),
  );

  const shutdown = async (signal) => {
    console.log(`[http] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDb().catch(() => {});
      await cache?.quit();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("[startup] failed:", err.message);
  process.exit(1);
});
