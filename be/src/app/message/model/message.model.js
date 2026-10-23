import { Schema, model } from "mongoose";

const messageSchema = new Schema(
  {
    content: { type: String, required: true, trim: true, maxLength: 500, minLength: 1 },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Kept for abuse handling only. `select:false` guarantees it is never returned
    // by a normal query, so recipients can never learn who wrote a message.
    sender: { type: Schema.Types.ObjectId, ref: "User", select: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);
messageSchema.index({ receiver: 1, isDeleted: 1, _id: -1 });

export const Message = model("Message", messageSchema);
