import { Schema, model } from "mongoose";

// "Who sent me this message?" asked by the RECIPIENT (requester) of an anonymous message.
// `target` is the message's sender. It is null when the sender is unknown (an anonymous visitor
// without an account) or is the requester themselves; such a request simply stays pending forever,
// which keeps it indistinguishable from "sender ignored it" (no anonymity leak).
const revealRequestSchema = new Schema(
  {
    message: { type: Schema.Types.ObjectId, ref: "Message", required: true, unique: true }, // one request per message
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
    target: { type: Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
    respondedAt: { type: Date },
  },
  { timestamps: true },
);
revealRequestSchema.index({ target: 1, status: 1, createdAt: -1 });
revealRequestSchema.index({ requester: 1, message: 1 });

export const RevealRequest = model("RevealRequest", revealRequestSchema);
