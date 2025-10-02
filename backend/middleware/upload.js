import multer from "multer";
import { minioClient, BUCKET_NAME } from "../config/minio.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// Configuration variables
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit for event images
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "localhost";
const MINIO_PORT = parseInt(process.env.MINIO_PORT) || 9000;
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === "true" || false;

// Helper function to generate permanent direct URLs
const generatePermanentUrl = (objectName) => {
  const protocol = MINIO_USE_SSL ? "https" : "http";
  const port =
    (MINIO_USE_SSL && MINIO_PORT === 443) ||
    (!MINIO_USE_SSL && MINIO_PORT === 80)
      ? ""
      : `:${MINIO_PORT}`;

  return `${protocol}://${MINIO_ENDPOINT}${port}/${BUCKET_NAME}/${objectName}`;
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

// Middleware to upload event image to MinIO
export const uploadEventImageToMinio = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `event-${uuidv4()}${fileExtension}`;
    const objectName = `events/${fileName}`;

    // Upload to MinIO
    await minioClient.putObject(
      BUCKET_NAME,
      objectName,
      req.file.buffer,
      req.file.size,
      {
        "Content-Type": req.file.mimetype,
      }
    );

    // Generate a permanent direct URL
    const permanentUrl = generatePermanentUrl(objectName);

    // Add image info to request
    req.uploadedImage = {
      fileName: fileName,
      objectName: objectName,
      url: permanentUrl,
      size: req.file.size,
      mimetype: req.file.mimetype,
    };

    console.log(`Event image uploaded successfully: ${objectName}`);
    next();
  } catch (error) {
    console.error("Error uploading event image to MinIO:", error);
    return res.status(500).json({
      error: "Upload failed",
      message: "Failed to upload event image to storage",
    });
  }
};

// Helper function to delete event image from MinIO
export const deleteEventImageFromMinio = async (imageUrl) => {
  try {
    if (!imageUrl) return true;

    // Extract object name from URL (works with both direct URLs and presigned URLs)
    let objectName;

    if (imageUrl.includes(MINIO_ENDPOINT)) {
      // Handle presigned URLs or direct URLs
      const url = new URL(imageUrl);
      objectName = url.pathname.substring(1); // Remove leading slash

      // Remove bucket name from path if it exists
      if (objectName.startsWith(`${BUCKET_NAME}/`)) {
        objectName = objectName.substring(BUCKET_NAME.length + 1);
      }
    } else {
      // Fallback for old URL format
      const urlParts = imageUrl.split("/");
      const bucketIndex = urlParts.indexOf(BUCKET_NAME);

      if (bucketIndex === -1) {
        console.log("Invalid image URL format");
        return false;
      }

      objectName = urlParts.slice(bucketIndex + 1).join("/");
    }

    await minioClient.removeObject(BUCKET_NAME, objectName);
    console.log(`Event image deleted successfully: ${objectName}`);
    return true;
  } catch (error) {
    console.error("Error deleting event image from MinIO:", error);
    return false;
  }
};

// Export the permanent URL generator for external use
export { generatePermanentUrl };

// Middleware for event image uploads
export const uploadEventImage = [
  upload.single("image"),
  uploadEventImageToMinio,
];

export { upload };
