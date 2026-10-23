import { updateAndGet } from "../../auth/repo/auth.repo.js";
import { User, newPublicId } from "../model/user.model.js";

export const getUserProfileRepo = (userId) =>
  User.findOne({ _id: userId, isDeleted: false });
export const getUserByPublicIdRepo = (publicId) =>
  User.findOne({ publicId, isDeleted: false });
export const updateProfileRepo = (id, data) =>
  updateAndGet(User, { _id: id }, data);

// Accounts created before `publicId` existed get one lazily.
export async function ensurePublicId(user) {
  if (user.publicId) return user;
  for (let i = 0; i < 3; i++) {
    try {
      return await updateAndGet(
        User,
        { _id: user._id },
        { publicId: newPublicId() },
      );
    } catch (e) {
      if (e?.code !== 11000) throw e;
    }
  }
  return user;
}
