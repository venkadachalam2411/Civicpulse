import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

let uploadsDir = path.join(__dirname, '../../uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch {
  uploadsDir = path.join(os.tmpdir(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (_) {}
  }
}

// Disk storage setup
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },

  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

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

// AWS S3 upload wrapper with local static URL fallback
export async function uploadToS3OrLocal(file: Express.Multer.File): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (bucket && region && accessKeyId && secretAccessKey && accessKeyId !== 'your_aws_access_key_id') {
    try {
      const s3Client = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });

      const fileStream = fs.createReadStream(file.path);
      const key = `issues/${Date.now()}-${path.basename(file.originalname)}`;

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileStream,
        ContentType: file.mimetype,
      });

      await s3Client.send(command);
      console.log(`[AWS S3] Successfully uploaded ${file.originalname} to bucket: ${bucket} (key: ${key})`);

      // Clean up local temp file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    } catch (err) {
      console.error('[AWS S3 Error] Upload failed, falling back to local file path:', err);
    }
  } else {
    console.warn(
      `[Storage Warning] AWS S3 credentials or bucket not fully configured in .env (AWS_S3_BUCKET=${bucket || 'MISSING'}, AWS_REGION=${region || 'MISSING'}, AWS_ACCESS_KEY_ID=${accessKeyId ? (accessKeyId.startsWith('your_') ? 'PLACEHOLDER' : 'SET') : 'MISSING'}). Saving locally.`
    );
  }

  // Return static local image URL served by Express static middleware
  return `/uploads/${path.basename(file.path)}`;
}
