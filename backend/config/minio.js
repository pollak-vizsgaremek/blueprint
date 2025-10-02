import { Client } from "minio";

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === "true" || false,
  accessKey: process.env.MINIO_ACCESS_KEY || "blueprint",
  secretKey: process.env.MINIO_SECRET_KEY || "blueprint",
});

const BUCKET_NAME = process.env.MINIO_BUCKET || "blueprint";

// Initialize bucket if it doesn't exist
const initializeBucket = async () => {
  try {
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME, "us-east-1");

      // Set bucket policy to public read for event images
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      };

      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      console.log(
        `Bucket ${BUCKET_NAME} created successfully with public read policy`
      );
    }
  } catch (error) {
    console.error("Error initializing MinIO bucket:", error);
  }
};

// Initialize bucket on startup
initializeBucket();

export { minioClient, BUCKET_NAME };
