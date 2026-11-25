import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createUploadUrl, deleteObject, objectExists, parseStorageEnv } from "@/lib/storage/r2";

// A0.7 acceptance: a real upload to the R2 dev bucket through a signed URL.
// Skips when R2 variables are not set (see README "Photo storage").
// KEEP_TEST_UPLOAD=1 leaves the file in the bucket so you can see it in the dashboard.
const hasR2 = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"].every(
  (k) => !!process.env[k],
);
const keep = process.env.KEEP_TEST_UPLOAD === "1";

// Smallest valid PNG (1x1 transparent pixel).
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

describe.skipIf(!hasR2)("real upload to R2 (A0.7)", () => {
  const env = hasR2 ? parseStorageEnv(process.env) : undefined;
  const userId = randomUUID();
  const keys: string[] = [];

  afterAll(async () => {
    if (keep || !env) return;
    for (const key of keys) await deleteObject(key, env);
  });

  it("uploads through a signed URL and the file is in the bucket", async () => {
    const { uploadUrl, key } = await createUploadUrl({ userId, contentType: "image/png", size: PNG.length }, env);
    keys.push(key);
    const put = await fetch(uploadUrl, { method: "PUT", headers: { "content-type": "image/png" }, body: PNG });
    expect(put.status).toBe(200);
    expect(await objectExists(key, env)).toBe(true);
    if (keep) console.info(`[r2] kept test upload: ${env!.R2_BUCKET}/${key}`);
  });

  it("rejects an upload with a different content type than was signed", async () => {
    const { uploadUrl, key } = await createUploadUrl({ userId, contentType: "image/png", size: PNG.length }, env);
    keys.push(key);
    const put = await fetch(uploadUrl, { method: "PUT", headers: { "content-type": "text/html" }, body: PNG });
    expect(put.status).toBe(403);
    expect(await objectExists(key, env)).toBe(false);
  });

  it("rejects an upload larger than the size that was signed", async () => {
    const { uploadUrl, key } = await createUploadUrl({ userId, contentType: "image/png", size: PNG.length }, env);
    keys.push(key);
    const bigger = Buffer.concat([PNG, Buffer.alloc(1024)]);
    const put = await fetch(uploadUrl, { method: "PUT", headers: { "content-type": "image/png" }, body: bigger });
    expect(put.status).toBe(403);
    expect(await objectExists(key, env)).toBe(false);
  });
});

if (!hasR2) {
  if (process.env.CI) {
    // In CI the real upload is required: missing secrets must fail, not skip.
    it("R2 secrets are configured in CI", () => {
      throw new Error("R2_* secrets are missing in CI (GitHub → Settings → Secrets and variables → Actions).");
    });
  } else {
    console.warn("[r2] R2_* variables not set: skipping the real upload test (see README 'Photo storage').");
  }
}
