import { trusted } from "mongoose";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { cache } from "../cache/init.js";
import AppError from "../../utils/error/error.js";
import { Session } from "../../app/auth/model/session.model.js";
import { User } from "../../app/user/model/user.model.js";

//issuer and audience for JWTs. 
//These are not secrets, but they are used to prevent a token from being used in the wrong context.
const ISS = "saraha";
const AUD = "saraha-web";
const b64 = (n) => crypto.randomBytes(n).toString("base64url");

// HMAC (not a bare hash) so a leaked sessions collection cannot be brute-forced
// without the server secret.
export const hmac = (value) =>
  crypto.createHmac("sha256", env.jwt.jwtSecret_refresh).update(String(value)).digest("hex");

// ---- Redis keys: namespaced + versioned, include user AND session id -------------
// Only opaque ids appear in keys; never tokens, emails or secrets.
const activeKey = (userId, sid) => `saraha:v1:sess:${userId}:${sid}`;
const userPattern = (userId) => `saraha:v1:sess:${userId}:*`;

// Cache helpers: any Redis failure degrades to "no cache", never to "allow".
async function cacheGet(key) {
  if (!cache) return null;
  try {
    return await cache.get(key);
  } catch {
    return null;
  }
}
async function cacheSet(key, ttl) {
  if (!cache) return;
  try {
    await cache.set(key, "1", ttl);
  } catch {
    /* ignore: next request re-validates against MongoDB */
  }
}
async function cacheDel(...keys) {
  if (!cache) return;
  try {
    await cache.del(...keys);
  } catch {
   }
}

export function signAccessToken(userId, sid) {
  return jwt.sign({ sid }, env.jwt.jwtSecret, {
    algorithm: "HS256",
    subject: String(userId),
    issuer: ISS,
    audience: AUD,
    expiresIn: env.accessTtlSec,
  });
}

function buildRefreshToken(sid, secret) {
  return `${sid}.${secret}`;
}
function parseRefreshToken(raw) {
  if (typeof raw !== "string" || raw.length > 200) return null;
  const parts = raw.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { sid: parts[0], secret: parts[1] };
}

export async function createSession(user, meta = {}) {
  const sid = b64(16);
  const secret = b64(32);
  const now = Date.now();
  await Session.create({
    sid,
    user: user._id,
    tokenHash: hmac(secret),
    userAgent: (meta.userAgent || "").slice(0, 200),
    absoluteExpiresAt: new Date(now + env.refreshAbsoluteTtlSec * 1000),
    expiresAt: new Date(now + env.refreshTtlSec * 1000),
  });
  await cacheSet(activeKey(user._id, sid), env.sessionCacheTtlSec);
  return {
    sid,
    accessToken: signAccessToken(user._id, sid),
    refreshToken: buildRefreshToken(sid, secret),
  };
}

// Validates an access token AND that its session is still alive.
export async function verifyAccessToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, env.jwt.jwtSecret, {
      algorithms: ["HS256"],
      issuer: ISS,
      audience: AUD,
    });
  } catch (err) {
    const expired = err?.name === "TokenExpiredError";
    throw new AppError(expired ? "Access token expired" : "Invalid access token", 401, {
      code: expired ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
    });
  }
  const userId = payload.sub;
  const sid = payload.sid;
  if (!userId || !sid) throw new AppError("Invalid access token", 401, { code: "TOKEN_INVALID" });

  const key = activeKey(userId, sid);
  if ((await cacheGet(key)) === "1") return { userId, sid };

  // Cache miss or Redis down: MongoDB decides.
  const session = await Session.findOne({
    sid,
    user: userId,
    revokedAt: null,
    expiresAt: trusted({ $gt: new Date() }),
  }).select("_id");
  if (!session) throw new AppError("Session is no longer valid", 401, { code: "SESSION_REVOKED" });
  await cacheSet(key, env.sessionCacheTtlSec);
  return { userId, sid };
}

// Rotates the refresh token. Safe under concurrency: the swap is a single atomic
// compare-and-set in MongoDB, so two parallel requests can never both succeed.
export async function rotateSession(rawRefreshToken, meta = {}) {
  const parsed = parseRefreshToken(rawRefreshToken);
  if (!parsed) throw new AppError("Refresh token is required", 401, { code: "NO_REFRESH" });
  const { sid, secret } = parsed;
  const presentedHash = hmac(secret);
  const now = new Date();

  const newSecret = b64(32);
  const current = await Session.findOne({ sid }).select("absoluteExpiresAt");
  const nextExpiry = current
    ? new Date(Math.min(now.getTime() + env.refreshTtlSec * 1000, current.absoluteExpiresAt.getTime()))
    : now;

  const updated = await Session.findOneAndUpdate(
    { sid, tokenHash: presentedHash, revokedAt: null, expiresAt: trusted({ $gt: now }) },
    {
      $set: {
        tokenHash: hmac(newSecret),
        prevTokenHash: presentedHash,
        rotatedAt: now,
        expiresAt: nextExpiry,
        userAgent: (meta.userAgent || "").slice(0, 200),
      },
    },
    { returnDocument: "after" },
  );

  if (!updated) {
    const s = await Session.findOne({ sid }).select("+prevTokenHash");
    if (s && !s.revokedAt && s.prevTokenHash === presentedHash) {
      const age = (now - s.rotatedAt) / 1000;
      if (age <= env.refreshGraceSec) {
        // Two tabs refreshed at the same moment. The winner already set new cookies.
        throw new AppError("Refresh already in progress", 409, { code: "REFRESH_RACE" });
      }
      await revokeSession(sid, s.user, "refresh_token_reuse");
    }
    throw new AppError("Invalid or expired refresh token", 401, { code: "REFRESH_INVALID" });
  }

  const user = await User.findById(updated.user);
  if (!user || user.isDeleted) {
    await revokeSession(sid, updated.user, "user_unavailable");
    throw new AppError("Invalid or expired refresh token", 401, { code: "REFRESH_INVALID" });
  }

  await cacheSet(activeKey(user._id, sid), env.sessionCacheTtlSec);
  return {
    user,
    sid,
    accessToken: signAccessToken(user._id, sid),
    refreshToken: buildRefreshToken(sid, newSecret),
  };
}

export async function revokeSession(sid, userId, reason = "logout") {
  const s = await Session.findOneAndUpdate(
    { sid, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } },
    { returnDocument: "after" },
  );
  const uid = userId ?? s?.user;
  if (uid) await cacheDel(activeKey(uid, sid));
  return !!s;
}

// Used on password change/reset: kills every device (optionally sparing one).
export async function revokeAllForUser(userId, { exceptSid, reason = "revoke_all" } = {}) {
  const filter = { user: userId, revokedAt: null };
  if (exceptSid) filter.sid = trusted({ $ne: exceptSid });
  const sessions = await Session.find(filter).select("sid");
  await Session.updateMany(filter, { $set: { revokedAt: new Date(), revokedReason: reason } });
  if (cache) {
    try {
      if (exceptSid) {
        const keys = sessions.map((s) => activeKey(userId, s.sid));
        if (keys.length) await cache.del(...keys);
      } else {
        await cache.scanDel(userPattern(userId));
      }
    } catch {
      /* bounded by sessionCacheTtlSec */
    }
  }
  return sessions.length;
}

export const sidFromRefreshToken = (raw) => parseRefreshToken(raw)?.sid ?? null;
