import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Use memory storage for serverless compatibility (no read-only disk errors on Vercel)
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|webp|gif/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed!'));
  },
});

// AWS S3 upload wrapper with fallback for local disk / base64 on serverless
export async function uploadToS3OrLocal(file: Express.Multer.File): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  // 1. Try AWS S3 if credentials are provided and not placeholders
  if (
    bucket &&
    region &&
    accessKeyId &&
    secretAccessKey &&
    accessKeyId !== 'your_aws_access_key_id' &&
    !accessKeyId.startsWith('your_')
  ) {
    try {
      const s3Client = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const key = `issues/${uniqueSuffix}${ext}`;

      const fileBuffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);

      if (fileBuffer) {
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: file.mimetype,
        });

        await s3Client.send(command);
        console.log(`[AWS S3] Successfully uploaded ${file.originalname} to bucket: ${bucket} (key: ${key})`);
        return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
      }
    } catch (err: any) {
      console.error('[AWS S3 Error] Upload failed, falling back:', err.message || err);
    }
  }

  // 2. Local disk fallback (for local development)
  const isVercel = !!process.env.VERCEL;
  if (!isVercel && file.buffer) {
    try {
      const uploadsDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      const filePath = path.join(uploadsDir, uniqueName);
      fs.writeFileSync(filePath, file.buffer);
      return `/uploads/${uniqueName}`;
    } catch (diskErr) {
      console.warn('[Storage Warning] Could not write to local uploads directory:', diskErr);
    }
  }

  // 3. Serverless Base64 Data URL fallback (if S3 is not configured on Vercel)
  if (file.buffer) {
    return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  }

  return '/uploads/default-placeholder.jpg';
}

