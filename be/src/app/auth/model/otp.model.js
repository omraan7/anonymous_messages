import { model, Schema } from "mongoose";

const otpSchema = new Schema(
  {
    // HMAC of the 6 digit code -- the code itself is never stored.
    codeHash: { type: String, required: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    // A code issued for one purpose cannot be used for the other.
    purpose: { type: String, enum: ["verify", "reset", "login"], required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
export const Otp = model("Otp", otpSchema);
