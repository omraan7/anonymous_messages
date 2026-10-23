import { verifyAccessToken } from "../session/session.service.js";
import { ACCESS_COOKIE } from "../session/cookies.js";

// Attaches req.user when a VALID session exists; otherwise continues anonymously.
export const optionalAuth = async (req, res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) return next();
  try {
    const { userId, sid } = await verifyAccessToken(token);
    req.user = { id: userId, sid };
  } catch {
    /* anonymous */
  }
  next();
};
