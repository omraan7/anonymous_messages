import { env } from "../config/env.js";
import AppError from "../../utils/error/error.js";

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// CSRF defence in depth (cookies are also SameSite): a browser always sends Origin on
// cross-origin unsafe requests, so refuse any whose Origin is not on the allow-list.
export const originCheck = (req, res, next) => {
  if (!UNSAFE.has(req.method)) return next();
  const origin = req.get("origin");
  if (origin) {
    if (!env.frontendOrigins.includes(origin.replace(/\/+$/, "")))
      return next(new AppError("Origin not allowed", 403, { code: "BAD_ORIGIN" }));
    return next();
  }
  // No Origin: non-browser clients are fine, but a browser marking it cross-site is not.
  if (req.get("sec-fetch-site") === "cross-site")
    return next(new AppError("Cross-site request blocked", 403, { code: "BAD_ORIGIN" }));
  next();
};
