import { verifyAccessToken } from "../session/session.service.js";
import { ACCESS_COOKIE } from "../session/cookies.js";
import AppError from "../../utils/error/error.js";

const readToken = (req) => {
  const h = req.headers.authorization;
  if (typeof h === "string" && h.startsWith("Bearer ")) return h.slice(7).trim();
  return req.cookies?.[ACCESS_COOKIE];
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = readToken(req);
    if (!token) throw new AppError("Authentication required", 401, { code: "NOT_AUTHENTICATED" });
    const { userId, sid } = await verifyAccessToken(token);
    req.user = { id: userId, sid };
    next();
  } catch (err) {
    next(err);
  }
};
