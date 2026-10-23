import AppError from "../../../utils/error/error.js";
import { getUserByPublicIdRepo } from "../../user/repo/user.repo.js";
import { getAllMessagesByUserId, saveMessageInDb, softDeleteOwnMessage } from "../repo/message.repo.js";

export const sendMessageService = async (content, receiverPublicId, senderId) => {
  const receiver = await getUserByPublicIdRepo(receiverPublicId);
  if (!receiver) throw new AppError("This profile doesn't exist", 404, { code: "NOT_FOUND" });
  await saveMessageInDb(content, receiver._id, senderId);
};

export const getAllMessagesByUserIdService = (userId, query) => getAllMessagesByUserId(userId, query);

export const deleteMessageService = async (id, userId) => {
  const doc = await softDeleteOwnMessage(id, userId);
  // 404 for both "doesn't exist" and "not yours": no information about other people's messages.
  if (!doc) throw new AppError("Message not found", 404, { code: "NOT_FOUND" });
};
