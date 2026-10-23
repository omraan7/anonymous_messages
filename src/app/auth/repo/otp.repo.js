import { Otp } from "./../model/otp.model.js";
export const createOtpRepo = async (otpData) => {
  // Implement logic to create a new OTP in the database
  return await Otp.create(otpData);
};
export const getOtpRepo = async (email) => {
  // Implement logic to get the OTP for the given email
  const otpRecord = await Otp.findOne({ email: email });

  return otpRecord;
};

export const deleteOtpRepo = async (email) => {
  return await Otp.deleteMany({ email: email });
};
