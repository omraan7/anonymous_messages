import { validationBody, validationParams } from "../../../lib/validation/validation.js";
import { listMessagesQuery, messageIdParam, sendMessageDto } from "../dto/dto.js";
import {
  deleteMessageService,
  getAllMessagesByUserIdService,
  sendMessageService,
} from "../service/message.service.js";

export const sendMessageController = async (req, res, next) => {
  try {
    const data = validationBody(sendMessageDto, req.body);
    await sendMessageService(data.content, data.receiver, req.user?.id);
    // Deliberately returns no message document.
    res.status(201).json({ message: "Message sent anonymously" });
  } catch (e) { next(e); }
};

export const getAllMessagesByUserIdController = async (req, res, next) => {
  try {
    const query = validationParams(listMessagesQuery, req.query);
    const { items, nextCursor } = await getAllMessagesByUserIdService(req.user.id, query);
    res.status(200).json({
      message: "Messages fetched",
      data: items.map((m) => ({ id: String(m._id), content: m.content, createdAt: m.createdAt })),
      nextCursor,
    });
  } catch (e) { next(e); }
};

export const deleteMessageController = async (req, res, next) => {
  try {
    const { id } = validationParams(messageIdParam, req.params);
    await deleteMessageService(id, req.user.id);
    res.status(200).json({ message: "Message deleted" });
  } catch (e) { next(e); }
};
