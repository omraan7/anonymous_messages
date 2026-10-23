import { env } from "../config/env.js";
import AppError from "../../utils/error/error.js";

export const notFound = (req, res, next) =>
  next(new AppError("Route not found", 404, { code: "NOT_FOUND" }));

// One consistent error shape: { message, code?, errors? }. Never leaks stacks.
export const errorHandler = (err, req, res, _next) => {
  let e = err;
  if (err?.type === "entity.parse.failed") e = new AppError("Malformed JSON body", 400, { code: "BAD_JSON" });
  else if (err?.type === "entity.too.large") e = new AppError("Request body too large", 413, { code: "TOO_LARGE" });
  else if (err?.name === "MulterError")
    e = new AppError(err.code === "LIMIT_FILE_SIZE" ? "Image must be 2MB or smaller" : "Invalid upload", err.code === "LIMIT_FILE_SIZE" ? 413 : 400, { code: "UPLOAD_ERROR" });
  else if (err?.name === "CastError") e = new AppError("Invalid identifier", 400, { code: "BAD_ID" });
  else if (err?.code === 11000) e = new AppError("Conflict", 409, { code: "DUPLICATE" });

  if (e instanceof AppError && e.isOperational) {
    return res.status(e.statusCode).json({
      message: e.message,
      ...(e.code && { code: e.code }),
      ...(e.errors && { errors: e.errors }),
    });
  }
  console.error(`[error] cid=${req.correlationId}`, env.isProd ? e?.message : e);
  res.status(500).json({ message: "Something went wrong", code: "INTERNAL" });
};
