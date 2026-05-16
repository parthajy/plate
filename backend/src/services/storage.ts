import crypto from 'node:crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { config } from '../config.js';
import { AppError } from '../lib/errors.js';

let cached: S3Client | null = null;

function client(): S3Client {
  if (cached) return cached;
  if (
    !config.SPACES_ENDPOINT ||
    !config.SPACES_REGION ||
    !config.SPACES_ACCESS_KEY ||
    !config.SPACES_SECRET
  ) {
    throw new AppError('STORAGE_NOT_CONFIGURED', 'Object storage is not configured', 500);
  }
  cached = new S3Client({
    endpoint: config.SPACES_ENDPOINT,
    region: config.SPACES_REGION,
    credentials: {
      accessKeyId: config.SPACES_ACCESS_KEY,
      secretAccessKey: config.SPACES_SECRET,
    },
    forcePathStyle: false,
  });
  return cached;
}

export interface UploadResult {
  url: string;
  key: string;
  sha256: string;
}

export async function uploadFoodScan(
  userId: string,
  bytes: Buffer,
  contentType: string,
): Promise<UploadResult> {
  if (!config.SPACES_BUCKET) {
    throw new AppError('STORAGE_NOT_CONFIGURED', 'Object storage bucket missing', 500);
  }
  const ext = contentType === 'image/png' ? 'png' : 'jpg';
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const key = `scans/${userId}/${sha256}.${ext}`;

  await client().send(
    new PutObjectCommand({
      Bucket: config.SPACES_BUCKET,
      Key: key,
      Body: bytes,
      ContentType: contentType,
      ACL: 'public-read',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  // DO Spaces public URL pattern. SPACES_ENDPOINT looks like
  // https://nyc3.digitaloceanspaces.com — the bucket is virtual-hosted.
  const endpointUrl = new URL(config.SPACES_ENDPOINT!);
  const url = `${endpointUrl.protocol}//${config.SPACES_BUCKET}.${endpointUrl.host}/${key}`;

  return { url, key, sha256 };
}
