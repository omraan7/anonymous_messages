import multer from "multer";
const multerUploader = (allowedTypes = ["image/jpeg", "image/png", "image/gif"]) => multer({
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file typesdfds"), false);
    }
  },
  storage: multer.diskStorage({
    destination: "Uploads",
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
});
export const uploadSingleFile = (fieldName, allowedTypes) => {
  return multerUploader(allowedTypes).single(fieldName);
}
export const uploadMultipleFiles = (fieldName, allowedTypes) => {
  return multerUploader(allowedTypes ).array(fieldName);
}
export const uploadFields = (fields, allowedTypes) => {
  return multerUploader(allowedTypes).fields(fields);
} 