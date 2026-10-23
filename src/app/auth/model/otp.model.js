import { model, Schema } from "mongoose";

const otpSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      length: 6,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index:{expires: 0}
    },
  },

  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
);
export const Otp = model("Otp", otpSchema);
