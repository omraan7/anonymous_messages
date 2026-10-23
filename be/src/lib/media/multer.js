import multer from "multer";
import AppError from "../../utils/error/error.js";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const DEFAULT_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// Memory storage: the bytes are validated and re-encoded before anything touches disk.
const multerUploader = (allowedTypes = DEFAULT_TYPES) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 5 },
    fileFilter: (req, file, cb) =>
      allowedTypes.includes(file.mimetype)
        ? cb(null, true)
        : cb(new AppError("Only JPEG, PNG, GIF or WebP images are allowed", 415, { code: "BAD_FILE_TYPE" })),
  });

export const uploadSingleFile = (fieldName, allowedTypes) => multerUploader(allowedTypes).single(fieldName);
