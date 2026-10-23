import { Schema, model } from "mongoose";

// One document per logged-in device/browser ("refresh token family").
// MongoDB is the source of truth; Redis only caches an "active" marker.
const sessionSchema = new Schema(
  {
    sid: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // HMAC of the CURRENT refresh secret. The plaintext secret is never stored.
    tokenHash: { type: String, required: true },
    // HMAC of the previously rotated secret, used to detect re-use of a stolen token.
    prevTokenHash: { type: String },
    rotatedAt: { type: Date },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String },
    userAgent: { type: String, maxLength: 200 },
    absoluteExpiresAt: { type: Date, required: true },
    // Sliding expiry; the TTL index removes the document afterwards.
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

export const Session = model("Session", sessionSchema);
