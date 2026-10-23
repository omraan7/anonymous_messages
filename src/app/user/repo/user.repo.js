import { User } from "../model/user.model.js"

export const getUserProfileRepo = async (userId) => {
  //get user profile data from the database based on the userId

  return await User.findById(userId)
}