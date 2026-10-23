import { checkIfUserExistsById } from "../../auth/repo/auth.repo.js";

export const getUserProfileService = async (userId) => {
  // Implement the logic to retrieve user profile data based on the userId
  const userExists = await checkIfUserExistsById(userId); // Assuming getUserById is a function that fetches user data from the database
  if (!userExists) throw new Error('User not found');
  

  return userExists;
};