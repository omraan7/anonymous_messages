import { Schema, model } from "mongoose";
import { randomBytes } from "crypto";

export const newPublicId = () => randomBytes(7).toString("base64url"); // ~9-10 url-safe chars

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 30,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // Never returned by default queries; login explicitly selects it.
    password: {
      type: String,
      select: false,
      required: function () {
        return this.provider === "local";
      },
    },
    provider: { type: String, enum: ["local", "google"], default: "local" },
    // Google account subject ("sub"). Account identity for Google is the sub, not the email.
    googleId: { type: String, unique: true, sparse: true, select: false },
    // Random, non-guessable id used in the public share link (/u/<publicId>).
    publicId: {
      type: String,
      unique: true,
      sparse: true,
      default: newPublicId,
    },
    avatar: {
      type: new Schema({ url: String, key: String }, { _id: false }),
      default: undefined,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    isDeleted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    // Email-OTP second step at login (toggled via PATCH /auth/two-step-verification).
    twoStepVerification: {
      type: String,
      enum: ["enabled", "disabled"],
      default: "disabled",
    },
    passwordChangedAt: { type: Date },
    dob: { type: Date },
    gender: {
      type: String,
      enum: ["male", "female"],
      default: "male",
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

// The ONLY shape of a user that may be sent to a browser.
userSchema.methods.toPublic = function () {
  return {
    id: String(this._id),
    name: this.name,
    email: this.email,
    publicId: this.publicId,
    avatarUrl: this.avatar?.url ?? null,
    provider: this.provider,
    isVerified: this.isVerified,
    twoStepVerification: this.twoStepVerification ?? "disabled",
    createdAt: this.createdAt,
  };
};

export const User = model("User", userSchema);
