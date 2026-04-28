import multer from "multer";
import { minioClient, BUCKET_NAME } from "../config/minio.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// Configuration variables
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit for event images
const PUBLIC_URL =
  process.env.MINIO_PUBLIC_URL || "https://blueprint-s3.gemes.eu";

// Helper function to generate permanent public URLs for uploaded images
const generatePermanentUrl = (objectName) => {
  // Normalize trailing slash to avoid accidental double slashes in output URLs
  const normalizedPublicUrl = PUBLIC_URL.replace(/\/+$/, "");
  return `${normalizedPublicUrl}/${BUCKET_NAME}/${objectName}`;
};

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

const createMinioImageUploadMiddleware = ({
  objectFolder,
  filePrefix,
  label,
}) => {
  return async (req, res, next) => {
    if (!req.file) {
      return next();
    }

    try {
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${filePrefix}-${uuidv4()}${fileExtension}`;
      const objectName = `${objectFolder}/${fileName}`;

      await minioClient.putObject(
        BUCKET_NAME,
        objectName,
        req.file.buffer,
        req.file.size,
        {
          "Content-Type": req.file.mimetype,
        },
      );

      const permanentUrl = generatePermanentUrl(objectName);

      req.uploadedImage = {
        fileName,
        objectName,
        url: permanentUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      };

      console.log(`${label} uploaded successfully: ${objectName}`);
      next();
    } catch (error) {
      console.error(`Error uploading ${label} to MinIO:`, error);
      return res.status(500).json({
        error: "Upload failed",
        message: `Failed to upload ${label} to storage`,
      });
    }
  };
};

export const uploadEventImageToMinio = createMinioImageUploadMiddleware({
  objectFolder: "events",
  filePrefix: "event",
  label: "event image",
});

export const uploadEventMapImageToMinio = createMinioImageUploadMiddleware({
  objectFolder: "event-maps",
  filePrefix: "event-map",
  label: "event map image",
});

// Helper function to delete an image from MinIO
export const deleteImageFromMinio = async (imageUrl) => {
  try {
    if (!imageUrl) return true;

    // Extract object name from URL
    let objectName;

    // Handle URLs proxied through /s3/ endpoint
    if (imageUrl.includes("/s3/")) {
      const url = new URL(imageUrl);
      const pathname = url.pathname;

      // Remove /s3/ prefix
      const s3Path = pathname.replace(/^\/s3\//, "");

      // Remove bucket name from path if it exists
      if (s3Path.startsWith(`${BUCKET_NAME}/`)) {
        objectName = s3Path.substring(BUCKET_NAME.length + 1);
      } else {
        objectName = s3Path;
      }
    } else {
      // Fallback for old URL formats
      const urlParts = imageUrl.split("/");
      const bucketIndex = urlParts.indexOf(BUCKET_NAME);

      if (bucketIndex === -1) {
        console.log("Invalid image URL format");
        return false;
      }

      objectName = urlParts.slice(bucketIndex + 1).join("/");
    }

    await minioClient.removeObject(BUCKET_NAME, objectName);
    console.log(`Image deleted successfully: ${objectName}`);
    return true;
  } catch (error) {
    console.error("Error deleting image from MinIO:", error);
    return false;
  }
};

// Backward-compatible export
export const deleteEventImageFromMinio = deleteImageFromMinio;

// Export the permanent URL generator for external use
export { generatePermanentUrl };

// Middleware for event image uploads
export const uploadEventImage = [
  upload.single("image"),
  uploadEventImageToMinio,
];

// Middleware for event map image uploads
export const uploadEventMapImage = [
  upload.single("image"),
  uploadEventMapImageToMinio,
];

export { upload };
