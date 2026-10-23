import { createOtpRepo } from "../../app/auth/repo/otp.repo.js";
import crypto from "crypto";

//generate otp and save in database
export const generateOtpRandomAndSave = async (email) => {
  // Generate a random 6-digit OTP
  const otp = await crypto.randomInt(100000, 999999).toString();
//create otp in database
  await createOtpRepo({
    code: otp,
    email: email,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
  });

  return otp;
};
