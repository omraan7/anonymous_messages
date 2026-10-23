import {
  checkIfUserExists,
  createUserRepo,
  resetPasswordRepo,
  updateVerifiedStatusRepo,
} from "../repo/auth.repo.js";
import bcrypt from "bcrypt";
import { createOtpRepo, deleteOtpRepo, getOtpRepo } from "../repo/otp.repo.js";
import { sendEmail } from "../../../lib/email/emailnode.js";
import jwt from "jsonwebtoken";
import { generateOtpRandomAndSave } from "../../../lib/utilty/utitty.js";
import { get } from "mongoose";
import AppError from "../../../utils/error/error.js";
import { OAuth2Client } from "google-auth-library";
import { verifyAccountGoogle } from "../../../lib/google/googleVerify.js";
import { env } from "../../../lib/config/env.js";
import { mailJetProvider } from "../../../lib/email/init.js";

// Register a new user
export const registerUserService = async (userData) => {
  //check if user exists
  const userExists = await checkIfUserExists(userData.email);
  if (!!userExists) throw new AppError("User already exists", 400);
  // Hash the password before saving the user
  userData.password = await bcrypt.hash(userData.password, 10);
  // Create the user in the database
  const user = await createUserRepo(userData);
  // Generate a random 6-digit OTP
  const otp = await generateOtpRandomAndSave(userData.email);
  // Create the OTP in the database

  // Send the OTP to the user's email
  // You can use a service like nodemailer to send the email
  await sendEmail(
    userData.email,
    "Your OTP Code",
    `<p>Your OTP code is: <strong>${otp}</strong></p>`,
  );

  return user;
};
// Verify OTP
export const verifyOtpService = async (email, otp) => {
  // Check if the account exists
  const accountExists = await checkIfUserExists(email);
  if (!accountExists) throw new AppError("Account does not exist", 400);

  //check if user verified or not
  if (accountExists.isVerified)
    throw new AppError("Account already verified", 400);

  //verify th otp from the database
  const otpRecord = await getOtpRepo(email);
  if (!otpRecord) throw new AppError("OTP not found or expired", 400);
  if (otpRecord.code !== otp) throw new AppError("Invalid OTP", 400);
  // Update the user's verified status in the database
  const accountUpdated = await updateVerifiedStatusRepo(email, {
    isVerified: true,
  });
  //Delete otp from the database after successful verification
  await deleteOtpRepo(email);

  return accountUpdated;
};

// Login
export const loginService = async (email, password) => {
  // Check if the account exists
  const accountExists = await checkIfUserExists(email);
  if (!accountExists)
    throw new AppError("Account does't exist register first", 400);

  //check if user verified or not
  if (!accountExists.isVerified)
    throw new AppError("Account not verified", 400);

  //check password
  const mathPassword = await bcrypt.compare(password, accountExists.password);
  if (!mathPassword) throw new AppError("Invalid password", 400);
  //generate token
  const accessToken = await jwt.sign(
    {
      id: accountExists._id,
      email: accountExists.email,
      name: accountExists.name,
    },
    env.jwt.jwtSecret,
    { expiresIn: "1h" },
  );
  const refreshToken = await jwt.sign(
    {
      id: accountExists._id,
      email: accountExists.email,
      name: accountExists.name,
    },
    env.jwt.jwtSecret_refresh,
    { expiresIn: "7h" },
  );

  //save refresh token in cache redis

  return { accessToken, refreshToken };
};

// Send OTP
export const sendOtpService = async (email) => {
  // Check if the account exists
  const accountExists = await checkIfUserExists(email);
  if (!accountExists) throw new AppError("Account does not exist");

  //delete otp from the database
  await deleteOtpRepo(email);
  // Generate a random 6-digit OTP
  const otp = await generateOtpRandomAndSave(email);
  await sendEmail(
    email,
    "Your OTP Code",
    `<p>Your OTP code is: <strong>${otp}</strong></p>`,
  );
};

export const resetPasswordService = async (email, otp, newPassword) => {
  const otpRecord = await getOtpRepo(email);
  if (!otpRecord) throw new AppError("OTP not found or expired");
  if (otpRecord.code !== otp) throw new AppError("Invalid OTP");
  const hashPassword = await bcrypt.hash(newPassword, 12);
  const newUser = await resetPasswordRepo(email, hashPassword);
  return newUser;
};
//change password but not testing
export const changePasswordService = async (email, password, newPassword) => {
  const accountExists = await checkIfUserExists(email);
  if (!accountExists) throw new AppError("Account does not exist");
  const mathPassword = await bcrypt.compare(password, accountExists.password);
  if (!mathPassword) throw new AppError("Invalid password");
  const hashPassword = await bcrypt.hash(newPassword, 12);
  const newUser = await resetPasswordRepo(email, hashPassword);
  return newUser;
};

export const verifyAccountGoogleService = async (idToken) => {
  const payload = await verifyAccountGoogle(idToken);
  const accountExists = await checkIfUserExists(payload.email);
  if (accountExists && accountExists.provider === "google") {
    const token = await jwt.sign(
      {
        email: accountExists.email,
        name: accountExists.name,
        id: accountExists._id,
      },
      env.jwt.jwtSecret,
      { expiresIn: "1h" },
    );
    return { token: token, provider: accountExists.provider };
  }

  const user = await createUserRepo({
    email: payload.email,
    name: payload.name,
    provider: "google",
    isVerified: true,
  });
  const token = await jwt.sign(
    { email: user.email, name: user.name, id: user._id },
    env.jwt.jwtSecret,
    { expiresIn: "1h" },
  );
  return { token: token };
};

export const refreshTokenService = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 401);
  }

  let payload;

  try {
    payload = jwt.verify(refreshToken, env.jwt.jwtSecret_refresh);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const accountExists = await checkIfUserExists(payload.email);

  if (!accountExists || String(accountExists._id) !== String(payload.id)) {
    throw new AppError("Account does not exist", 401);
  }

  const accessToken = jwt.sign(
    {
      id: accountExists._id,
      email: accountExists.email,
      name: accountExists.name,
    },
    env.jwt.jwtSecret,
    { expiresIn: "1h" },
  );

  const newRefreshToken = jwt.sign(
    {
      id: accountExists._id,
      email: accountExists.email,
      name: accountExists.name,
    },
    env.jwt.jwtSecret_refresh,
    { expiresIn: "7h" },
  );

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};
