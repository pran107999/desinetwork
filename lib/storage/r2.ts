import "server-only";
import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { UPLOAD_URL_TTL_SECONDS, buildUploadKey, type UploadRequest } from "./rules";

// The only module that talks to Cloudflare R2 (CLAUDE.md §5). R2 speaks the
// S3 protocol, so the official AWS SDK is used with R2's endpoint.

const required = (name: string) => z.string({ error: `${name} is missing` }).min(1, `${name} is missing`);
const storageSchema = z.object({
  R2_ACCOUNT_ID: required("R2_ACCOUNT_ID"),
  R2_ACCESS_KEY_ID: required("R2_ACCESS_KEY_ID"),
  R2_SECRET_ACCESS_KEY: required("R2_SECRET_ACCESS_KEY"),
  R2_BUCKET: required("R2_BUCKET"),
});
export type StorageEnv = z.infer<typeof storageSchema>;

export function parseStorageEnv(source: Record<string, string | undefined>): StorageEnv {
  const result = storageSchema.safeParse(source);
  if (!result.success) {
    // Variable names only, never values.
    throw new Error(`Invalid storage environment: ${result.error.issues.map((i) => i.message).join("; ")}`);
  }
  return result.data;
}

function client(env: StorageEnv) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
  });
}

const resolveEnv = (env?: StorageEnv) => env ?? parseStorageEnv(process.env);

// Signed PUT URL for one photo. Content type and exact size are signed,
// so R2 rejects any other file sent with this link.
export async function createUploadUrl(
  request: UploadRequest & { userId: string },
  env?: StorageEnv,
): Promise<{ uploadUrl: string; key: string; expiresIn: number }> {
  const e = resolveEnv(env);
  const key = buildUploadKey(request.userId, request.contentType);
  const command = new PutObjectCommand({
    Bucket: e.R2_BUCKET,
    Key: key,
    ContentType: request.contentType,
    ContentLength: request.size,
  });
  const uploadUrl = await getSignedUrl(client(e), command, {
    expiresIn: UPLOAD_URL_TTL_SECONDS,
    signableHeaders: new Set(["content-type", "content-length"]),
  });
  return { uploadUrl, key, expiresIn: UPLOAD_URL_TTL_SECONDS };
}

export async function objectExists(key: string, env?: StorageEnv): Promise<boolean> {
  const e = resolveEnv(env);
  try {
    await client(e).send(new HeadObjectCommand({ Bucket: e.R2_BUCKET, Key: key }));
    return true;
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) return false;
    throw err;
  }
}

export async function deleteObject(key: string, env?: StorageEnv): Promise<void> {
  const e = resolveEnv(env);
  await client(e).send(new DeleteObjectCommand({ Bucket: e.R2_BUCKET, Key: key }));
}
