import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import AppError from "../../utils/error/error.js";

const client = new OAuth2Client();

// Cryptographically verifies a Google ID token (signature, issuer, expiry, audience).
// Never trusts any email/profile sent separately by the browser.
// Test seam: replaced ONLY when NODE_ENV=test so Google's servers aren't needed in CI.
let testVerifier = null;
export const __setGoogleVerifierForTests = (fn) => {
  if (!env.isTest) throw new Error("test-only");
  testVerifier = fn;
};

export const verifyAccountGoogle = async (idToken) => {
  if (testVerifier) return testVerifier(idToken);
  if (!env.webClientId) {
    throw new AppError("Google sign-in is not configured", 503, { code: "GOOGLE_NOT_CONFIGURED" });
  }
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: env.webClientId });
    return ticket.getPayload();
  } catch {
    throw new AppError("Invalid Google credential", 401, { code: "GOOGLE_INVALID" });
  }
};
