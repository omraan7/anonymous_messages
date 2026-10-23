import { validationBody } from "../../../lib/validation/validation.js";
import { registerUserDto } from "../dto/dto.js";
import {
  changePasswordService,
  loginService,
  refreshTokenService,
  registerUserService,
  resetPasswordService,
  sendOtpService,
  verifyAccountGoogleService,
  verifyOtpService,
} from "./../service/auth.service.js";
export const registerUserController = async (req, res, next) => {
  try {
    const data = await validationBody(registerUserDto, req.body);
    const user = await registerUserService(data);

    res.status(201).json({
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtpController = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await verifyOtpService(email, otp);
    res.status(200).json({ message: "User verified successfully", data: user });
  } catch (error) {
    next(error);
  }
};

export const loginUserController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken } = await loginService(email, password);
    res.cookie("accessToken", accessToken, { httpOnly: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true });

    res.status(200).json({ message: "User logged in successfully" });
  } catch (error) {
    next(error);
  }
};

export const sendOtpController = async (req, res, next) => {
  try {
    const { email } = req.body;
    await sendOtpService(email);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    next(error);
  }
};
export const resetPasswordController = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    await resetPasswordService(email, otp, newPassword);
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
    console.log(error);
  }
};

export const changePasswordController = async (req, res, next) => {
  try {
    const { email, password, newPassword } = req.body;
    await changePasswordService(email, password, newPassword);
    res.status(200).json({ message: "Password Change successfully" });
  } catch (error) {
    next(error);
  }
};

export const verifyAccountGoogleController = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const { token, provider } = await verifyAccountGoogleService(idToken);
    res.cookie("token", token, { httpOnly: true });

    if (provider) {
      return res.status(200).json({ message: "User logged in successfully" });
    } else {
      return res.status(201).json({ message: "User created successfully" });
    }
  } catch (error) {
    next(error);
  }
};



export const refreshTokenController = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    const tokens = await refreshTokenService(refreshToken);

    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Tokens refreshed successfully",
    });
  } catch (error) {
    next(error);
  }
};