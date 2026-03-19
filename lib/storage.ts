import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const BUCKET = process.env.STORAGE_BUCKET || "rux-storage";
const PUBLIC_DOMAIN = "https://cdn.rulxy.space";

let _client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return _client;
}

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<void> {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  );
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 900,
): Promise<string> {
  const client = getR2Client();
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn },
  );
}

export function getPublicUrl(key: string): string {
  return `${PUBLIC_DOMAIN}/${key}`;
}

export const STORAGE_LIMITS: Record<string, number> = {
  FREE: 100 * 1024 * 1024, // 100MB
  PRO: 1024 * 1024 * 1024, // 1GB
  ELITE: 10 * 1024 * 1024 * 1024, // 10GB
};

export function getStorageLimit(plan: string): number {
  return STORAGE_LIMITS[plan] || STORAGE_LIMITS.FREE;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getStorageUsage(
  supabase: any,
  projectId: string,
): Promise<number> {
  const { data: storageData } = await supabase
    .from("storage_files")
    .select("size")
    .eq("project_id", projectId)
    .is("deleted_at", null);

  return (
    storageData?.reduce(
      (sum: number, f: { size?: number }) => sum + (f.size || 0),
      0,
    ) || 0
  );
}
