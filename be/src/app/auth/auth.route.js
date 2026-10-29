import { Router } from "express";
import * as c from "./controller/auth.controller.js";
import { requireAuth } from "../../lib/auth/requireAuth.js";
import { authLimiter, otpLimiter } from "../../lib/security/rateLimit.js";

const authRouter = Router();

authRouter.post("/register", authLimiter, c.registerUserController);
authRouter.patch("/verify-otp", authLimiter, c.verifyOtpController);
authRouter.post("/login", authLimiter, c.loginUserController);
authRouter.post("/send-otp", otpLimiter, c.sendOtpController);
authRouter.patch("/reset-password", authLimiter, c.resetPasswordController);
authRouter.patch(
  "/change-password",
  requireAuth,
  authLimiter,
  c.changePasswordController,
);
authRouter.post("/login-google", authLimiter, c.verifyAccountGoogleController);
authRouter.post("/refresh-token", c.refreshTokenController);
authRouter.post("/logout", c.logoutController);
authRouter.post("/logout-all", requireAuth, c.logoutAllController);
authRouter.patch(
  "/two-step-verification",
  requireAuth,
  c.twoStepVerificationController,
);
authRouter.post("/verify-login-otp", otpLimiter, c.verifyLoginOtpController);

export default authRouter;
