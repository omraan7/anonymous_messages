import {Router}from 'express';
import { getAllMessagesByUserIdController, sendMessageController } from './controller/message.controller.js';
import { optionalAuth } from '../../lib/auth/optionalAuth.js';
const messageRouter = Router();
messageRouter.post("/",optionalAuth,sendMessageController)
messageRouter.get("/",optionalAuth,getAllMessagesByUserIdController)
export default messageRouter;