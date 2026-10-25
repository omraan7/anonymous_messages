import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import { env } from "./lib/config/env.js";
import { cache } from "./lib/cache/init.js";
import { correlationId } from "./lib/corrlation/corrlationid.js";
import { globalLimiter } from "./lib/security/rateLimit.js";
import { originCheck } from "./lib/security/originCheck.js";
import { errorHandler, notFound } from "./lib/security/errorHandler.js";
import { uploadRoot } from "./lib/storage/local.js";
import authRouter from "./app/auth/auth.route.js";
import userRouter from "./app/user/user.route.js";
import messageRouter from "./app/message/message.route.js";
import revealRouter from "./app/reveal/reveal.route.js";
import conversationRouter from "./app/conversation/conversation.route.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", env.trustProxy);

  app.use(helmet());
  app.use(correlationId);
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || env.frontendOrigins.includes(origin)),
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: "10kb" }));
  app.use(cookieParser());
  app.use(globalLimiter);
  app.use(originCheck);

  const p = env.apiPrefix;

  app.get(`${p}/health`, async (req, res) => {
    let redis = "disabled";
    if (cache) {
      try { await cache.ping(); redis = "up"; } catch { redis = "down"; }
    }
    const db = mongoose.connection.readyState === 1 ? "up" : "down";
    // Redis being down degrades performance only; the DB is what makes us "ready".
    res.status(db === "up" ? 200 : 503).json({ status: db === "up" ? "ok" : "degraded", db, redis });
  });

  // Avatars: nosniff + long cache (filenames are random and never reused).
  app.use(
    `${p}/uploads`,
    express.static(uploadRoot, {
      index: false,
      dotfiles: "deny",
      maxAge: "30d",
      immutable: true,
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      },
    }),
  );

  app.use(`${p}/auth`, authRouter);
  app.use(`${p}/user`, userRouter);
  app.use(`${p}/message`, messageRouter);
  app.use(`${p}/reveal-requests`, revealRouter);
  app.use(`${p}/conversations`, conversationRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
