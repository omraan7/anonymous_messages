import { fileTypeFromBuffer } from "file-type";
import AppError from "../../utils/error/error.js";

// Checks the real file signature (magic bytes), not the client-supplied mimetype/extension.
export const fileValidation =
  (allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]) =>
  async (req, res, next) => {
    try {
      if (!req.file?.buffer) throw new AppError("Image file is required (field \"pp\")", 400, { code: "NO_FILE" });
      const type = await fileTypeFromBuffer(req.file.buffer);
      if (!type || !allowedTypes.includes(type.mime))
        throw new AppError("File content is not a valid image", 415, { code: "BAD_FILE_TYPE" });
      req.file.detectedMime = type.mime;
      next();
    } catch (e) {
      next(e);
    }
  };
