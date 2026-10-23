import {Router}from 'express';
import { uploadSingleFile } from '../../lib/media/multer.js';
import { fileValidation } from '../../lib/media/validationFile.js';
import { getUserProfileController } from './controller/user.controller.js';
import { optionalAuth } from '../../lib/auth/optionalAuth.js';
// Create a new router instance for user routes
const userRouter = Router();

userRouter.post('/profile-picture',uploadSingleFile('pp', ['image/jpeg', 'image/png', 'image/gif']),
fileValidation(['image/jpeg', 'image/png', 'image/gif']), (req, res, next) => {
res.json({ message: 'User route is working!' });
});
userRouter.get('/user',optionalAuth,getUserProfileController);
export default userRouter; 