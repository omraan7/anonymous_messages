import { User } from "./../../user/model/user.model.js";


export const checkIfUserExists = (email, { withSecrets = false } = {}) => {
  const q = User.findOne({ email });
  return withSecrets ? q.select("+password +googleId") : q;
};
export const checkIfUserExistsById = (id) =>
  User.findOne({ _id: id, isDeleted: false });
export const findByGoogleId = (googleId) =>
  User.findOne({ googleId }).select("+googleId");
export const createUserRepo = (userData) => User.create(userData);
export const updateUserRepo = (id, data) =>
  updateAndGet(User, { _id: id }, data);
export const updateVerifiedStatusRepo = (email, data) =>
  updateAndGet(User, { email }, data);
export const resetPasswordRepo = (email, passwordHash) =>
  updateAndGet(
    User,
    { email },
    { password: passwordHash, passwordChangedAt: new Date() },
  );
export const getUserByIdRepo = (userId) =>
  User.findOne({ _id: userId, isDeleted: false }).select("+password");

export const toggleTwoStepVerificationRepo = (userId, status) => {
  return User.findOneAndUpdate(
    { _id: userId },
    { twoStepVerification: status },
  );
};

// Attaches a Google identity to an existing account. When `wipePassword` is set the
// local password is removed (used when the local account was never email-verified).
export const linkGoogleRepo = (id, googleId, { wipePassword = false } = {}) =>
  updateAndGet(
    User,
    { _id: id },
    wipePassword
      ? {
          $set: { googleId, isVerified: true, provider: "google" },
          $unset: { password: 1 },
        }
      : { $set: { googleId } },
  );

export async function updateAndGet(Model, filter, update) {
  const res = await Model.updateOne(filter, update);
  if (!res.matchedCount) return null;
  return Model.findOne(filter);
}


export const recordFailedLoginAttempt = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $inc: { failedLoginAttempts: 1 },
    },
    {
      new: true,
    },
  );

  if (!user) {
    throw new Error("User not found while recording failed login");
  }

  if (user.failedLoginAttempts >= 3) {
    return User.findByIdAndUpdate(
      userId,
      {
        $set: { isBanned: true },
      },
      {
        new: true,
      },
    );
  }

  return user;
};

export const resetFailedLoginAttempts = (userId) =>
  User.updateOne(
    { _id: userId, isBanned: false },
    { $set: { failedLoginAttempts: 0 } },
  );
