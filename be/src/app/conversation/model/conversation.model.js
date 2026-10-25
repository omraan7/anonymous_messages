import { Schema, model } from "mongoose";

// A private thread between exactly two users, created when a sender ACCEPTS a reveal request.
// `revealed` = users who consented to be identified; their earlier anonymous messages to the other
// member are shown in the thread, a non-consenting member's are not.
const conversationSchema = new Schema(
  {
    pairKey: { type: String, required: true, unique: true }, // "<smallerId>:<largerId>"
    members: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], validate: (v) => v.length === 2 },
    revealed: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
conversationSchema.index({ members: 1, lastMessageAt: -1 });

export const pairKeyOf = (a, b) => [String(a), String(b)].sort().join(":");
export const Conversation = model("Conversation", conversationSchema);
