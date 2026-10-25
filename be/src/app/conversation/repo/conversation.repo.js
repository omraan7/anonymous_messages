import { trusted } from "mongoose";
import { Conversation, pairKeyOf } from "../model/conversation.model.js";
import { Message } from "../../message/model/message.model.js";
import { User } from "../../user/model/user.model.js";

// Creates the thread if needed and records that `consenterId` agreed to be identified.
export async function upsertConversation(consenterId, otherId) {
  const pairKey = pairKeyOf(consenterId, otherId);
  const run = () =>
    Conversation.findOneAndUpdate(
      { pairKey },
      {
        $setOnInsert: { members: [consenterId, otherId] },
        $addToSet: { revealed: consenterId },
        $set: { lastMessageAt: new Date() },
      },
      { upsert: true, returnDocument: "after" },
    );
  try {
    return await run();
  } catch (e) {
    if (e?.code === 11000) return run(); // lost the creation race; the doc exists now
    throw e;
  }
}

export const findConversationByPair = (a, b) => Conversation.findOne({ pairKey: pairKeyOf(a, b) });
export const findMyConversation = (id, userId) => Conversation.findOne({ _id: id, members: userId });
export const listMyConversations = (userId) =>
  Conversation.find({ members: userId }).sort({ lastMessageAt: -1 }).limit(50).lean();
export const listMyConversationsLight = (userId) => Conversation.find({ members: userId }).select("members revealed").lean();

// Only bumps when `senderId` already consented (so non-participants cause no writes).
export const touchIfRevealed = (senderId, receiverId) =>
  Conversation.updateOne({ pairKey: pairKeyOf(senderId, receiverId), revealed: senderId }, { $set: { lastMessageAt: new Date() } });
export const touchConversation = (id) => Conversation.updateOne({ _id: id }, { $set: { lastMessageAt: new Date() } });

export const findUsersBasic = (ids) =>
  ids.length ? User.find({ _id: trusted({ $in: ids }) }).select("name publicId avatar").lean() : [];

// Thread = (a) replies written inside the conversation + (b) earlier/later anonymous messages
// from members who consented to be identified (sender -> the other member only).
export async function threadMessages(conv, me, { limit, cursor }) {
  const other = conv.members.map(String).find((m) => m !== String(me));
  const or = [{ conversation: conv._id }];
  for (const u of conv.revealed) {
    or.push({ sender: u, receiver: String(u) === String(me) ? other : me, conversation: null });
  }
  const filter = { isDeleted: false, $or: or };
  if (cursor) filter._id = trusted({ $lt: cursor });
  const rows = await Message.find(filter, "content createdAt +sender").sort({ _id: -1 }).limit(limit + 1).lean();
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? String(items[items.length - 1]._id) : null, other };
}

export const createThreadMessage = (conv, me, other, content) =>
  Message.create({ content, sender: me, receiver: other, conversation: conv._id });
