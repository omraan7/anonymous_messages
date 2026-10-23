import AppError from "../../../utils/error/error.js";
import {
  checkIfUserExists,
  checkIfUserExistsById,
} from "../../auth/repo/auth.repo.js";
import { getAllMessagesByUserId, saveMessageInDb } from "../repo/message.repo.js";

export const sendMessageService = async (content, receiver, sender) => {
  console.log("receiver",receiver);
  console.log("sender",sender);
  const receiverAccountExists = await checkIfUserExistsById(receiver);
  if (!receiverAccountExists) throw new AppError("user is not exist", 400);
  if (!content) throw new AppError("content is required", 400);
  if (content.trim().length === 0)
    throw new AppError("message cannot be empty", 400);
  const message = await saveMessageInDb(content, receiver, sender);
  return message;
};

export const getAllMessagesByUserIdService = async (userId) => {
  const userExists = await checkIfUserExistsById(userId);
  if (!userExists) throw new AppError("user is not exist", 400);

  const messages = await getAllMessagesByUserId(userId);
  if (!messages) throw new AppError("no messages found", 404);
  return messages;
};