import { trusted } from "mongoose";
import crypto from "crypto";
import { Otp } from "../../app/auth/model/otp.model.js";
import { hmac } from "../session/session.service.js";

export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_RESEND_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

// Uniform 6-digit code, 000000-999999.
const generateCode = () => crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

export const otpHash = (email, purpose, code) => hmac(`otp:${purpose}:${email}:${code}`);

// Returns the plaintext code ONLY so it can be emailed; the DB keeps a hash.
// Returns null when throttled (a code was issued in the last minute).
export const generateOtpRandomAndSave = async (email, purpose) => {
  const last = await Otp.findOne({ email, purpose }).sort({ createdAt: -1 }).select("createdAt");
  if (last && Date.now() - last.createdAt.getTime() < OTP_RESEND_MS) return null;
  await Otp.deleteMany({ email, purpose });
  const code = generateCode();
  await Otp.create({
    email,
    purpose,
    codeHash: otpHash(email, purpose, code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });
  return code;
};

// Atomically checks a code. Single-use; locks after OTP_MAX_ATTEMPTS wrong tries.
export const consumeOtp = async (email, purpose, code) => {
  const record = await Otp.findOneAndUpdate(
    { email, purpose, expiresAt: trusted({ $gt: new Date() }) },
    { $inc: { attempts: 1 } },
    { returnDocument: "after" },
  );
  if (!record) return false;
  if (record.attempts > OTP_MAX_ATTEMPTS) {
    await Otp.deleteMany({ email, purpose });
    return false;
  }
  const a = Buffer.from(record.codeHash);
  const b = Buffer.from(otpHash(email, purpose, code));
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (ok) await Otp.deleteMany({ email, purpose });
  return ok;
};
