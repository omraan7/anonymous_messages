import { Router } from "express";
import {
  changePasswordController,
  loginUserController,
  refreshTokenController,
  registerUserController,
  resetPasswordController,
  sendOtpController,
  verifyAccountGoogleController,
  verifyOtpController,
} from "./controller/auth.controller.js";
const authRouter = Router();

authRouter.post("/register", registerUserController);
authRouter.patch("/verify-otp", verifyOtpController);
authRouter.post("/login", loginUserController);
authRouter.post("/send-otp", sendOtpController);
authRouter.patch("/reset-password", resetPasswordController);
authRouter.patch("/change-password", changePasswordController);
authRouter.post("/login-google", verifyAccountGoogleController);
authRouter.post("/refresh-token", refreshTokenController);
export default authRouter;
