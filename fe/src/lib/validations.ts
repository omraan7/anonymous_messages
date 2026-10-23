import { z } from "zod";

// Mirrors the backend rules so users get instant feedback; the backend stays the authority.
const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email"));
const newPassword = z.string().min(8, "At least 8 characters").max(64, "At most 64 characters");
export const otpField = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code");

export const loginSchema = z.object({ email, password: z.string().min(1, "Password is required") });

export const registerSchema = z
  .object({
    name: z.string().trim().min(3, "At least 3 characters").max(30, "At most 30 characters"),
    email,
    password: newPassword,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export const verifySchema = z.object({ otp: otpField });
export const forgotSchema = z.object({ email });
export const resetSchema = z
  .object({ otp: otpField, newPassword, confirmPassword: z.string().min(1, "Please confirm your password") })
  .refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export const messageSchema = z.object({
  message: z.string().trim().min(1, "Write something first").max(500, "Keep it under 500 characters"),
});
export const nameSchema = z.object({ name: z.string().trim().min(3, "At least 3 characters").max(30, "At most 30 characters") });
export const changePasswordSchema = z
  .object({ password: z.string().min(1, "Enter your current password"), newPassword, confirmPassword: z.string().min(1, "Please confirm") })
  .refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type VerifyValues = z.infer<typeof verifySchema>;
export type ForgotValues = z.infer<typeof forgotSchema>;
export type ResetValues = z.infer<typeof resetSchema>;
export type MessageValues = z.infer<typeof messageSchema>;
export type NameValues = z.infer<typeof nameSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
