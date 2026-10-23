import { getUserProfileService } from "../service/user.service.js";

export const getUserProfileController = async (req, res, next) => {
  try {
        const userId = req.user?.id; // Assuming the user ID is stored in the cookies
    const userProfile = await getUserProfileService(userId);
    res.json(userProfile);
  } catch (error) {
    next(error);
  }
};