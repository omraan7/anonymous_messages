import { trusted } from "mongoose";
import { RevealRequest } from "../model/revealRequest.model.js";
import { Message } from "../../message/model/message.model.js";

export const findOwnedMessageWithSender = (messageId, ownerId) =>
  Message.findOne({ _id: messageId, receiver: ownerId, isDeleted: false, conversation: null }).select("+sender").lean();

export async function createRequest({ message, requester, target }) {
  try {
    const doc = await RevealRequest.create({ message, requester, target });
    return doc;
  } catch (e) {
    if (e?.code !== 11000) throw e;
    return RevealRequest.findOne({ message }); // already requested: idempotent
  }
}

export const statusesForMessages = (requester, messageIds) =>
  messageIds.length
    ? RevealRequest.find({ requester, message: trusted({ $in: messageIds }) }).select("message status").lean()
    : [];

export const pendingForTarget = (target) =>
  RevealRequest.find({ target, status: "pending" }).sort({ createdAt: -1 }).limit(100).lean();

export const messagesByIds = (ids) =>
  ids.length ? Message.find({ _id: trusted({ $in: ids }), isDeleted: false }).select("content createdAt").lean() : [];

// Atomic: only the target, only while pending. Two clicks can never both "win".
export const respond = (id, target, status) =>
  RevealRequest.findOneAndUpdate(
    { _id: id, target, status: "pending" },
    { $set: { status, respondedAt: new Date() } },
    { returnDocument: "after" },
  );
export const existsForTarget = (id, target) => RevealRequest.exists({ _id: id, target });
export const resolveSamePair = (target, requester) =>
  RevealRequest.updateMany({ target, requester, status: "pending" }, { $set: { status: "accepted", respondedAt: new Date() } });
