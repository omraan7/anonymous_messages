import { Router } from "express";
import { requireAuth } from "../../lib/auth/requireAuth.js";
import { chatLimiter } from "../../lib/security/rateLimit.js";
import * as c from "./controller/conversation.controller.js";

const conversationRouter = Router();
conversationRouter.use(requireAuth);
conversationRouter.get("/", c.listConversationsController);
conversationRouter.get("/:id/messages", c.threadController);
conversationRouter.post("/:id/messages", chatLimiter, c.sendInThreadController);
export default conversationRouter;
