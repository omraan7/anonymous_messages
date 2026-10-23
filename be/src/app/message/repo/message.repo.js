import { trusted } from "mongoose";
import { Message } from "./../model/message.model.js";

export const saveMessageInDb = (content, receiver, sender) =>
  Message.create({ content, receiver, ...(sender ? { sender } : {}) });

// Cursor pagination (newest first). `sender` is select:false in the schema and is
// never populated here, so recipients cannot learn who wrote a message.
export const getAllMessagesByUserId = async (userId, { limit, cursor }) => {
  const filter = { receiver: userId, isDeleted: false };
  if (cursor) filter._id = trusted({ $lt: cursor });
  const rows = await Message.find(filter, "content createdAt").sort({ _id: -1 }).limit(limit + 1).lean();
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? String(items[items.length - 1]._id) : null };
};

// Ownership is part of the query filter: you can only ever delete your own messages.
export const softDeleteOwnMessage = async (id, ownerId) => {
  const res = await Message.updateOne(
    { _id: id, receiver: ownerId, isDeleted: false },
    { $set: { isDeleted: true } },
  );
  return res.matchedCount === 1;
};
