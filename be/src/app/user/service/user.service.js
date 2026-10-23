import crypto from "crypto";
import sharp from "sharp";
import AppError from "../../../utils/error/error.js";
import * as storage from "../../../lib/storage/local.js";
import {
  ensurePublicId,
  getUserByPublicIdRepo,
  getUserProfileRepo,
  updateProfileRepo,
} from "../repo/user.repo.js";

export const getUserProfileService = async (userId) => {
  if (!userId) throw new AppError("Authentication required", 401, { code: "NOT_AUTHENTICATED" });
  const user = await getUserProfileRepo(userId);
  if (!user) throw new AppError("User not found", 404, { code: "NOT_FOUND" });
  return ensurePublicId(user);
};

export const updateProfileService = async (userId, { name }) => {
  const user = await updateProfileRepo(userId, { name });
  if (!user) throw new AppError("User not found", 404, { code: "NOT_FOUND" });
  return user;
};

// Only the fields safe to show to strangers.
export const getPublicProfileService = async (publicId) => {
  const user = await getUserByPublicIdRepo(publicId);
  if (!user) throw new AppError("This profile doesn't exist", 404, { code: "NOT_FOUND" });
  return { publicId: user.publicId, name: user.name, avatarUrl: user.avatar?.url ?? null };
};

export const uploadAvatarService = async (userId, buffer) => {
  const user = await getUserProfileRepo(userId);
  if (!user) throw new AppError("User not found", 404, { code: "NOT_FOUND" });

  let processed;
  try {
    // Re-encoding strips EXIF (GPS!) and any embedded payload; output is always WebP.
    processed = await sharp(buffer, { limitInputPixels: 24_000_000, animated: false })
      .rotate()
      .resize(512, 512, { fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new AppError("Could not process this image", 415, { code: "BAD_FILE_TYPE" });
  }

  const key = `${userId}-${crypto.randomBytes(9).toString("base64url")}.webp`;
  const saved = await storage.save(key, processed);
  const oldKey = user.avatar?.key;
  try {
    const updated = await updateProfileRepo(userId, { avatar: { url: saved.url, key: saved.key } });
    if (oldKey) await storage.remove(oldKey).catch(() => {});
    return updated;
  } catch (e) {
    await storage.remove(key).catch(() => {});
    throw e;
  }
};
