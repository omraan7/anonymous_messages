import { validationBody } from "../../../lib/validation/validation.js";
import { sendMessageDto } from "../dto/dto.js";
import { getAllMessagesByUserIdService, sendMessageService } from "../service/message.service.js";

export const sendMessageController = async (req, res, next) => {
  try {
    const data = await validationBody(sendMessageDto, req.body);
    const sender = req.user?.id;

  const message = await sendMessageService(data.content, data.receiver, sender);
    res.status(200).json({ message: "message send successfully" , data: message });
  } catch (error) {
    console.log(error);

    next(error);
  }
};

export const getAllMessagesByUserIdController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const messages = await getAllMessagesByUserIdService(userId);
    res.status(200).json({ message: "messages fetched successfully", data: messages });
  } catch (error) {
    next(error);
  }
};