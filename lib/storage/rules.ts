import { randomUUID } from "node:crypto";
import { z } from "zod";
import { storageText } from "./text";

// Photo upload rules (PRD T1.5): jpg/png/webp, at most 10 MB each.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const UPLOAD_URL_TTL_SECONDS = 300;

export const ALLOWED_UPLOAD_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type UploadContentType = keyof typeof ALLOWED_UPLOAD_TYPES;
export type UploadRequest = { contentType: UploadContentType; size: number };

const contentTypes = Object.keys(ALLOWED_UPLOAD_TYPES) as [UploadContentType, ...UploadContentType[]];

const uploadRequestSchema = z.object({
  contentType: z.enum(contentTypes, { error: storageText.badType }),
  size: z
    .number({ error: storageText.badSize })
    .int(storageText.badSize)
    .positive(storageText.badSize)
    .max(MAX_UPLOAD_BYTES, storageText.tooLarge),
});

export function parseUploadRequest(
  input: unknown,
): { ok: true; value: UploadRequest } | { ok: false; error: string } {
  const result = uploadRequestSchema.safeParse(input);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, error: result.error.issues[0]?.message ?? storageText.badRequest };
}

const uuid = z.uuid();

// incoming/<user>/<random>.<ext>: private originals, processed in T1.5.
export function buildUploadKey(userId: string, contentType: UploadContentType, id: string = randomUUID()): string {
  uuid.parse(userId);
  return `incoming/${userId}/${id}.${ALLOWED_UPLOAD_TYPES[contentType]}`;
}
