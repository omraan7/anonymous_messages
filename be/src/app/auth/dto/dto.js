import { z } from "zod";

// trim -> lowercase -> validate (zod 4's .lowercase() is a *check*, not a transform).
const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email").max(254));
// bcrypt only uses the first 72 bytes, so cap length rather than silently truncating.
const newPassword = z.string().min(8, "Password must be at least 8 characters").max(64, "Password must be at most 64 characters");
const otp = z.string().trim().regex(/^\d{6}$/, "Code must be 6 digits");

export const registerUserDto = z.object({
  email,
  password: newPassword,
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(30),
}); // `provider` is deliberately NOT accepted from the client.

export const loginUserDto = z.object({ email, password: z.string().min(1).max(128) });
export const sendOtpDto = z.object({ email, purpose: z.enum(["verify", "reset"]) });
export const verifyOtpDto = z.object({ email, otp });
export const resetPasswordDto = z.object({ email, otp, newPassword });
export const changePasswordDto = z.object({ password: z.string().min(1).max(128), newPassword });
export const verifyAccountGoogleDto = z.object({ idToken: z.string().min(20).max(4096) });
