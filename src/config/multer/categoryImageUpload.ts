import multer from "multer";
import path from "path";
import fs from "fs";

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const savePath = "uploads/categories/images";
    // Ensure the directory exists
    fs.mkdirSync(savePath, { recursive: true }); // Creates the directory if it doesn't exist
    cb(null, savePath); // Directory where files will be stored
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`); // Unique file name
  },
});
``;
// File filter to allow only image uploads
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPG, PNG, and GIF files are allowed.")
    );
  }
};

// Multer configuration
const categoryImageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Max file size: 5MB
  },
});

export default categoryImageUpload;
