import { Schema, model } from "mongoose";

const messageSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxLength: 500,
      minLength: 1,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
  },
);

export const Message = model("Message", messageSchema);
