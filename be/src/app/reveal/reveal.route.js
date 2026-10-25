import { Router } from "express";
import { requireAuth } from "../../lib/auth/requireAuth.js";
import { revealLimiter } from "../../lib/security/rateLimit.js";
import * as c from "./controller/reveal.controller.js";

const revealRouter = Router();
revealRouter.use(requireAuth); // everything here is private
revealRouter.post("/", revealLimiter, c.createRevealController);
revealRouter.get("/", c.listIncomingController);
revealRouter.get("/pending-count", c.pendingCountController);
revealRouter.post("/:id/accept", c.acceptController);
revealRouter.post("/:id/decline", c.declineController);
export default revealRouter;
