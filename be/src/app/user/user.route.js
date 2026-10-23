import { Router } from "express";
import { uploadSingleFile } from "../../lib/media/multer.js";
import { fileValidation } from "../../lib/media/validationFile.js";
import { requireAuth } from "../../lib/auth/requireAuth.js";
import { uploadLimiter } from "../../lib/security/rateLimit.js";
import {
  getPublicProfileController,
  getUserProfileController,
  updateProfileController,
  uploadAvatarController,
} from "./controller/user.controller.js";

const userRouter = Router();

userRouter.get("/me", requireAuth, getUserProfileController);
userRouter.get("/user", requireAuth, getUserProfileController); // legacy alias
userRouter.patch("/me", requireAuth, updateProfileController);
userRouter.post(
  "/profile-picture",
  requireAuth,
  uploadLimiter,
  uploadSingleFile("pp"),
  fileValidation(),
  uploadAvatarController,
);
userRouter.get("/public/:publicId", getPublicProfileController);
export default userRouter;
