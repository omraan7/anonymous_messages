import bcrypt from "bcrypt";
import AppError from "../../../utils/error/error.js";
import { sendEmail } from "../../../lib/email/emailnode.js";
import { verifyAccountGoogle } from "../../../lib/google/googleVerify.js";
import {
  consumeOtp,
  generateOtpRandomAndSave,
} from "../../../lib/utilty/utitty.js";
import {
  createSession,
  revokeAllForUser,
  revokeSession,
  rotateSession,
  signAccessToken,
} from "../../../lib/session/session.service.js";
import {
  checkIfUserExists,
  checkIfUserExistsById,
  createUserRepo,
  findByGoogleId,
  getUserByIdRepo,
  linkGoogleRepo,
  resetPasswordRepo,
  toggleTwoStepVerificationRepo,
  updateUserRepo,
  updateVerifiedStatusRepo,
  recordFailedLoginAttempt,
  resetFailedLoginAttempts,
} from "../repo/auth.repo.js";

const BCRYPT_ROUNDS = 12;
// Used to equalize timing when the account does not exist (prevents user enumeration by latency).
const DUMMY_HASH = bcrypt.hashSync("saraha-dummy-password", BCRYPT_ROUNDS);

const BAD_CREDENTIALS = () =>
  new AppError("Invalid email or password", 401, { code: "BAD_CREDENTIALS" });

async function emailOtp(email, purpose) {
  const code = await generateOtpRandomAndSave(email, purpose);

  // A code was already issued during the last minute.
  // Keep the existing code usable instead of issuing another one.
  if (!code) return;

  const subjects = {
    verify: "Verify your Saraha account",
    reset: "Reset your Saraha password",
    login: "Verify your Saraha login",
  };

  const subject = subjects[purpose];

  if (!subject) {
    throw new AppError("Unsupported OTP purpose", 400, {
      code: "INVALID_OTP_PURPOSE",
    });
  }

  await sendEmail(
    email,
    subject,
    `<p>Your code is: <strong style="font-size:20px;letter-spacing:3px; color:#007bff  ">${code}</strong></p>
    <p>It expires in 5 minutes. If you did not request it, ignore this email.</p>`,
  );
}

// Register. The response is identical whether or not the email is already known,
// so the endpoint cannot be used to discover who has an account.
export const registerUserService = async ({ email, password, name }) => {
  const existing = await checkIfUserExists(email);
  if (existing?.isBanned) return;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  if (!existing) {
    await createUserRepo({
      email,
      name,
      password: passwordHash,
      provider: "local",
    });
    await emailOtp(email, "verify");
  } else if (!existing.isVerified && existing.provider === "local") {
    await updateUserRepo(existing._id, { name, password: passwordHash });
    await emailOtp(email, "verify");
  }
};

export const verifyOtpService = async (email, code) => {
  const ok = await consumeOtp(email, "verify", code);
  if (!ok)
    throw new AppError("Invalid or expired code", 400, { code: "OTP_INVALID" });
  const user = await updateVerifiedStatusRepo(email, { isVerified: true });
  if (!user)
    throw new AppError("Invalid or expired code", 400, { code: "OTP_INVALID" });
  return user;
};

export const verifyLoginOtpService = async (email, code, meta) => {
  const user = await checkIfUserExists(email);

  if (user?.isBanned) {
    throw new AppError("Account is banned", 403, {
      code: "ACCOUNT_BANNED",
    });
  }

  if (!user || user.isDeleted || !user.isVerified) {
    throw new AppError("Invalid or expired verification code", 401, {
      code: "INVALID_LOGIN_OTP",
    });
  }

  // The account must still require two-step verification.
  if (user.twoStepVerification !== "enabled") {
    throw new AppError("Login verification is not required", 400, {
      code: "LOGIN_VERIFICATION_NOT_REQUIRED",
    });
  }

  const isValid = await consumeOtp(email, "login", code);

  if (!isValid) {
    throw new AppError("Invalid or expired verification code", 401, {
      code: "INVALID_LOGIN_OTP",
    });
  }

  const session = await createSession(user, meta);

  return {
    user,
    ...session,
  };
};

export const loginService = async (email, password, meta) => {
  const user = await checkIfUserExists(email, {
    withSecrets: true,
  });

  const hash = user?.password || DUMMY_HASH;
  const match = await bcrypt.compare(password, hash);

  if (user?.isBanned) {
    throw new AppError("Account is banned", 403, {
      code: "ACCOUNT_BANNED",
    });
  }

  if (!user || !user.password || !match || user.isDeleted) {
    if (user && user.password && !user.isDeleted) {
      const updatedUser = await recordFailedLoginAttempt(user._id);

      if (updatedUser?.isBanned) {
        throw new AppError(
          "Account banned after 3 failed login attempts",
          403,
          { code: "ACCOUNT_BANNED" },
        );
      }
    }

    throw BAD_CREDENTIALS();
  }

  if (!user.isVerified) {
    throw new AppError("Please verify your email first", 403, {
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  // Correct password: reset the failed-attempt counter.
  await resetFailedLoginAttempts(user._id);

  if (user.twoStepVerification === "enabled") {
    await emailOtp(email, "login");

    return {
      user,
      requiresTwoStepVerification: true,
    };
  }

  const session = await createSession(user, meta);

  return {
    user,
    ...session,
    requiresTwoStepVerification: false,
  };
};

export const sendOtpService = async (email, purpose) => {
  const user = await checkIfUserExists(email);
  if (!user || user.isDeleted) return; // silent: no enumeration
  if (purpose === "verify" && user.isVerified) return;
  await emailOtp(email, purpose);
};

export const resetPasswordService = async (email, code, newPassword) => {
  const ok = await consumeOtp(email, "reset", code);
  if (!ok)
    throw new AppError("Invalid or expired code", 400, { code: "OTP_INVALID" });
  const user = await resetPasswordRepo(
    email,
    await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
  );
  if (!user)
    throw new AppError("Invalid or expired code", 400, { code: "OTP_INVALID" });
  // Proving control of the mailbox also verifies it.
  if (!user.isVerified) await updateUserRepo(user._id, { isVerified: true });
  // A reset means the old password may be compromised -> log out every device.
  await revokeAllForUser(user._id, { reason: "password_reset" });
};

export const changePasswordService = async (
  userId,
  currentSid,
  password,
  newPassword,
) => {
  const user = await getUserByIdRepo(userId);
  if (!user?.password)
    throw new AppError("This account has no password set", 400, {
      code: "NO_PASSWORD",
    });
  if (!(await bcrypt.compare(password, user.password)))
    throw new AppError("Current password is incorrect", 400, {
      code: "BAD_CURRENT_PASSWORD",
    });
  await resetPasswordRepo(
    user.email,
    await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
  );
  await revokeAllForUser(user._id, {
    exceptSid: currentSid,
    reason: "password_change",
  });
};

export const refreshTokenService = (refreshToken, meta) =>
  rotateSession(refreshToken, meta);

export const logoutService = async (sid, userId) => {
  if (sid) await revokeSession(sid, userId, "logout");
};
export const logoutAllService = (userId) =>
  revokeAllForUser(userId, { reason: "logout_all" });
export { signAccessToken, checkIfUserExistsById };

export const twoStepVerificationService = async (userId) => {
  const user = await checkIfUserExistsById(userId);
  if (user.twoStepVerification === "enabled") {
    await toggleTwoStepVerificationRepo(userId, "disabled");
    return "disabled";
  } else {
    await toggleTwoStepVerificationRepo(userId, "enabled");
    return "enabled";
  }
};

// ---------------------------- Google Sign-In -------------------------------------

export const verifyAccountGoogleService = async (idToken, meta) => {
  const payload = await verifyAccountGoogle(idToken);

  if (!payload.sub || !payload.email || payload.email_verified !== true) {
    throw new AppError("Google account email is not verified", 403, {
      code: "GOOGLE_EMAIL_UNVERIFIED",
    });  }

  const email = payload.email.trim().toLowerCase();
  let created = false;
  let user = await findByGoogleId(payload.sub);

  if (user?.isBanned) {
    throw new AppError("Account is banned", 403, {
      code: "ACCOUNT_BANNED",
    });
  }

  if (!user) {
    const byEmail = await checkIfUserExists(email, {
      withSecrets: true,
    });

    // 2. Check the email account only if it exists.
    if (byEmail?.isBanned) {
      throw new AppError("Account is banned", 403, {
        code: "ACCOUNT_BANNED",
      });
    }

    if (byEmail) {
      if (byEmail.isDeleted) {
        throw new AppError("Account unavailable", 403, {
          code: "ACCOUNT_UNAVAILABLE",
        });}
      if (byEmail.isVerified) {
        user = await linkGoogleRepo(byEmail._id, payload.sub);
      } else {
        await revokeAllForUser(byEmail._id, {
          reason: "google_link_unverified",
        });
        user = await linkGoogleRepo(byEmail._id, payload.sub, {
          wipePassword: true,
        });
      }
    } else {
      const name = (payload.name || email.split("@")[0])
        .slice(0, 30)
        .padEnd(3, "_");
      user = await createUserRepo({
        email,
        name,
        provider: "google",
        googleId: payload.sub,
        isVerified: true,
      });
      created = true;
    }
  }

  // 4. Final account status check.
  if (user.isBanned) {
    throw new AppError("Account is banned", 403, {
      code: "ACCOUNT_BANNED",
    });
  }

  if (user.isDeleted) {
    throw new AppError("Account unavailable", 403, {
      code: "ACCOUNT_UNAVAILABLE",
    });}
  const session = await createSession(user, meta);

  return { user, created, ...session };
};
