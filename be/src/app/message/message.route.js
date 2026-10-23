import { Router } from "express";
import {
  deleteMessageController,
  getAllMessagesByUserIdController,
  sendMessageController,
} from "./controller/message.controller.js";
import { optionalAuth } from "../../lib/auth/optionalAuth.js";
import { requireAuth } from "../../lib/auth/requireAuth.js";
import { messageLimiter } from "../../lib/security/rateLimit.js";

const messageRouter = Router();
messageRouter.post("/", messageLimiter, optionalAuth, sendMessageController);
messageRouter.get("/", requireAuth, getAllMessagesByUserIdController);
messageRouter.delete("/:id", requireAuth, deleteMessageController);
export default messageRouter;
