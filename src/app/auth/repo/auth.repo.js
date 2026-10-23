import { User } from "./../../user/model/user.model.js";

// Implement logic to check if a user with the given email exists in the database
export const checkIfUserExists = async (email) => {
  // Implement logic to check if a user with the given email exists in the database
  const user = await User.findOne({ email: email });
  return user; // Return the user if they exist, null otherwise
};

export const checkIfUserExistsById = async (id) => {
  // Implement logic to check if a user with the given email exists in the database
  const user = await User.findOne({ _id: id });
  return user; // Return the user if they exist, null otherwise
};
// Implement logic to create a new user in the database
export const createUserRepo = async (userData) => {
  return await User.create(userData);
};

//implement logic to update the verified status of a user in the database
export const updateVerifiedStatusRepo = async (email, updatedData) => {
  const user = await User.findOneAndUpdate({ email: email }, updatedData, {
    returnDocument: "after",
  });
  return user; // Return the updated user
};

export const resetPasswordRepo = async (email, password) => {
  const user = await User.findOneAndUpdate(
    { email: email },
    { password: password },
    { returnDocument: "after" },
  );
  return user;
};
