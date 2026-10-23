import { validationBody } from "../../../lib/validation/validation.js";
import {
  changePasswordDto,
  loginUserDto,
  registerUserDto,
  resetPasswordDto,
  sendOtpDto,
  verifyAccountGoogleDto,
  verifyOtpDto,
} from "../dto/dto.js";
import * as svc from "../service/auth.service.js";
import {
  REFRESH_COOKIE,
  ACCESS_COOKIE,
  clearSessionCookies,
  setSessionCookies,
} from "../../../lib/session/cookies.js";
import {
  sidFromRefreshToken,
  verifyAccessToken,
} from "../../../lib/session/session.service.js";

const meta = (req) => ({ userAgent: req.get("user-agent") });

// If a browser logs in as a different account, retire the previous session so it
// does not linger as an orphan (account switching).
async function retirePreviousSession(req) {
  const sid = sidFromRefreshToken(req.cookies?.[REFRESH_COOKIE]);
  if (sid) await svc.logoutService(sid).catch(() => {});
}

const GENERIC =
  "If the details are valid, we've sent a verification code to your email.";

export const registerUserController = async (req, res, next) => {
  try {
    const data = validationBody(registerUserDto, req.body);
    await svc.registerUserService(data);
    res.status(201).json({ message: GENERIC });
  } catch (e) {
    next(e);
  }
};

export const verifyOtpController = async (req, res, next) => {
  try {
    const { email, otp } = validationBody(verifyOtpDto, req.body);
    await svc.verifyOtpService(email, otp);
    res.status(200).json({ message: "Email verified. You can now log in." });
  } catch (e) {
    next(e);
  }
};


///

export const loginUserController = async (req, res, next) => {
  try {
    const { email, password } = validationBody(loginUserDto, req.body);

    await retirePreviousSession(req);

    const {
      user,
      accessToken,
      refreshToken,
      requiresTwoStepVerification,
    } = await svc.loginService(email, password, meta(req));

    if (requiresTwoStepVerification) {
      return res.status(200).json({
        message: "Password verified. Check your email for the login verification code.",
        requiresTwoStepVerification: true,
        email,
      });
    }

    setSessionCookies(res, { accessToken, refreshToken });

    return res.status(200).json({
      message: "Logged in",
      data: { user: user.toPublic() },
    });
  } catch (e) {
    next(e);
  }
};

////////
export const verifyLoginOtpController = async (req, res, next) => {
  try {
    const { email, otp } = validationBody(verifyOtpDto, req.body);

    const { user, accessToken, refreshToken } =
      await svc.verifyLoginOtpService(email, otp, meta(req));

    setSessionCookies(res, { accessToken, refreshToken });

    return res.status(200).json({
      message: "Logged in successfully",
      data: { user: user.toPublic() },
    });
  } catch (e) {
    next(e);
  }
};


export const sendOtpController = async (req, res, next) => {
  try {
    const { email, purpose } = validationBody(sendOtpDto, req.body);
    await svc.sendOtpService(email, purpose);
    res
      .status(200)
      .json({ message: "If that account exists, a code has been sent." });
  } catch (e) {
    next(e);
  }
};

export const resetPasswordController = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = validationBody(
      resetPasswordDto,
      req.body,
    );
    await svc.resetPasswordService(email, otp, newPassword);
    res.status(200).json({ message: "Password reset. Please log in." });
  } catch (e) {
    next(e);
  }
};

export const changePasswordController = async (req, res, next) => {
  try {
    const { password, newPassword } = validationBody(
      changePasswordDto,
      req.body,
    );
    await svc.changePasswordService(
      req.user.id,
      req.user.sid,
      password,
      newPassword,
    );
    res
      .status(200)
      .json({ message: "Password changed. Other devices were logged out." });
  } catch (e) {
    next(e);
  }
};

export const verifyAccountGoogleController = async (req, res, next) => {
  try {
    const { idToken } = validationBody(verifyAccountGoogleDto, req.body);
    await retirePreviousSession(req);
    const { user, created, accessToken, refreshToken } =
      await svc.verifyAccountGoogleService(idToken, meta(req));
    setSessionCookies(res, { accessToken, refreshToken });
    res.status(created ? 201 : 200).json({
      message: created ? "Account created" : "Logged in",
      data: { user: user.toPublic() },
    });
  } catch (e) {
    next(e);
  }
};

export const refreshTokenController = async (req, res, next) => {
  try {
    const out = await svc.refreshTokenService(
      req.cookies?.[REFRESH_COOKIE],
      meta(req),
    );
    setSessionCookies(res, out);
    res.status(200).json({
      message: "Session refreshed",
      data: { user: out.user.toPublic() },
    });
  } catch (e) {
    // A lost race (409) must keep the cookies the winning request just set.
    if (e.statusCode === 401) clearSessionCookies(res);
    next(e);
  }
};

// Idempotent: always succeeds from the client's point of view.
export const logoutController = async (req, res, next) => {
  try {
    let sid = sidFromRefreshToken(req.cookies?.[REFRESH_COOKIE]);
    let userId;
    if (!sid && req.cookies?.[ACCESS_COOKIE]) {
      try {
        ({ sid, userId } = await verifyAccessToken(req.cookies[ACCESS_COOKIE]));
      } catch {
      
      }
    }
    await svc.logoutService(sid, userId);
    clearSessionCookies(res);
    res.status(200).json({ message: "Logged out" });
  } catch (e) {
    next(e);
  }
};

export const logoutAllController = async (req, res, next) => {
  try {
    await svc.logoutAllService(req.user.id);
    clearSessionCookies(res);
    res.status(200).json({ message: "Logged out of all devices" });
  } catch (e) {
    next(e);
  }
};

export const twoStepVerificationController = async (req, res, next) => {
  try {
    const result = await svc.twoStepVerificationService(req.user.id);
    res.status(200).json({
      message: `Two-step verification is ${result === "enabled" ? "enabled" : "disabled"}`,
    });
  } catch (e) {
    next(e);
  }
};
