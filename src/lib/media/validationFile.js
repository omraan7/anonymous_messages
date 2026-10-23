import { fileTypeFromBuffer } from "file-type";
import fs from "fs";
import AppError from './../../utils/error/error.js';

// Middleware to validate file type by magic number (file signatures)
export const fileValidation =(allowedTypes=["image/jpeg", "image/png", "image/gif"])=> async (req, res, next) => {
  try {
    // get the file path
    const filePath = req.file.path;
    // read the file and return buffer
    const buffer = fs.readFileSync(filePath);
    // get the file type
    const type = await fileTypeFromBuffer(buffer);
    // validate
    if (!type || !allowedTypes.includes(type.mime)){
      fs.unlinkSync(filePath); // delete the file if invalid
      return next(new AppError("Invalid file typfde", 400));
    }


    return next();
  } catch (error) {
    return next(new AppError("Internal server error", 500));
  }
};