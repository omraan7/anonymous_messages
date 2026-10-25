import { validationBody, validationParams } from "../../../lib/validation/validation.js";
import { createRevealDto, revealIdParam } from "../dto/dto.js";
import * as svc from "../service/reveal.service.js";

export const createRevealController = async (req, res, next) => {
  try {
    const { messageId } = validationBody(createRevealDto, req.body);
    const data = await svc.createRevealRequestService(req.user.id, messageId);
    res.status(201).json({ message: "Request sent", data });
  } catch (e) { next(e); }
};
export const listIncomingController = async (req, res, next) => {
  try { res.json({ data: await svc.listIncomingService(req.user.id) }); } catch (e) { next(e); }
};
export const pendingCountController = async (req, res, next) => {
  try { res.json({ data: { count: await svc.pendingCountService(req.user.id) } }); } catch (e) { next(e); }
};
const responder = (action) => async (req, res, next) => {
  try {
    const { id } = validationParams(revealIdParam, req.params);
    const data = await svc.respondService(req.user.id, id, action);
    res.json({ message: action === "accept" ? "Accepted" : "Declined", data });
  } catch (e) { next(e); }
};
export const acceptController = responder("accept");
export const declineController = responder("decline");
