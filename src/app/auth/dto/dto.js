import { z } from "zod";

export const registerUserDto = z.object({
  email: z.string().email().min(5).max(50).lowercase().trim(),
  password: z.string().min(6).max(20).trim(),
  name: z.string().min(3).max(30).trim(),
  provider: z.enum(["google", "local"]).default("local"),
});
export const loginUserDto =z.object({
  email: z.string().email().min(5).max(50).lowercase().trim(),
  password: z.string().min(6).max(20).trim(),
});
export const sendOtpDto = z.object({
  email: z.string().email().min(5).max(50).lowercase().trim(),
});
export const verifyOtpDto = z.object({
  email: z.string().email().min(5).max(50).lowercase().trim(),
  otp: z.string().min(6).max(6).trim(),
});
export const changePasswordDto = z.object({
  email: z.string().email().min(5).max(50).lowercase().trim(),
  password: z.string().min(6).max(20).trim(),
  newPassword: z.string().min(6).max(20).trim(),
});
export const resetPasswordDto = z.object({
  email: z.string().email().min(5).max(50).lowercase().trim(),
  otp: z.string().min(6).max(6).trim(),
  newPassword: z.string().min(6).max(20).trim(),
});
export const verifyAccountGoogleDto = z.object({
  idToken: z.string().min(10).trim(),
});