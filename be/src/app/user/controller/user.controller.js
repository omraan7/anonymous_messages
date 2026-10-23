import { z } from "zod";
import { validationBody } from "../../../lib/validation/validation.js";
import {
  getPublicProfileService,
  getUserProfileService,
  updateProfileService,
  uploadAvatarService,
} from "../service/user.service.js";

const updateProfileDto = z.object({ name: z.string().trim().min(3, "Name must be at least 3 characters").max(30) });

export const getUserProfileController = async (req, res, next) => {
  try {
    const user = await getUserProfileService(req.user?.id);
    res.json({ data: user.toPublic() });
  } catch (e) { next(e); }
};

export const updateProfileController = async (req, res, next) => {
  try {
    const body = validationBody(updateProfileDto, req.body);
    const user = await updateProfileService(req.user.id, body);
    res.json({ message: "Profile updated", data: user.toPublic() });
  } catch (e) { next(e); }
};

export const uploadAvatarController = async (req, res, next) => {
  try {
    const user = await uploadAvatarService(req.user.id, req.file.buffer);
    res.json({ message: "Profile picture updated", data: user.toPublic() });
  } catch (e) { next(e); }
};

export const getPublicProfileController = async (req, res, next) => {
  try {
    const profile = await getPublicProfileService(String(req.params.publicId).slice(0, 40));
    res.json({ data: profile });
  } catch (e) { next(e); }
};
