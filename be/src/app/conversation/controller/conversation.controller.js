import { z } from "zod";
import {
  validationBody,
  validationParams,
} from "../../../lib/validation/validation.js";
import { listMessagesQuery } from "../../message/dto/dto.js";
import * as svc from "../service/conversation.service.js";

const idParam = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id"),
});
const bodyDto = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message can't be empty")
    .max(500, "Message must be 500 characters or fewer"),
});

export const listConversationsController = async (req, res, next) => {
  try {
    res.json({ data: await svc.listConversationsService(req.user.id) });
  } catch (e) {
    next(e);
  }
};
export const threadController = async (req, res, next) => {
  try {
    const { id } = validationParams(idParam, req.params);
    const query = validationParams(listMessagesQuery, req.query);
    const { items, nextCursor, other } = await svc.threadService(
      req.user.id,
      id,
      query,
    );
    res.json({ data: items, nextCursor, other });
  } catch (e) {
    next(e);
  }
};
export const sendInThreadController = async (req, res, next) => {
  try {
    const { id } = validationParams(idParam, req.params);
    const { content } = validationBody(bodyDto, req.body);
    res.status(201).json({
      message: "Sent",
      data: await svc.sendInThreadService(req.user.id, id, content),
    });
  } catch (e) {
    next(e);
  }
};
