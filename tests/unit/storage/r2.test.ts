import { describe, expect, it } from "vitest";
import { createUploadUrl, parseStorageEnv } from "@/lib/storage/r2";

const env = {
  R2_ACCOUNT_ID: "0123456789abcdef0123456789abcdef",
  R2_ACCESS_KEY_ID: "test-access-key",
  R2_SECRET_ACCESS_KEY: "test-secret-key",
  R2_BUCKET: "desinetwork-photos-dev",
};
const USER = "6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";

describe("R2 signed upload URL (A0.7)", () => {
  it("signs a PUT to the bucket, tied to content type and size, valid 5 minutes", async () => {
    const { uploadUrl, key, expiresIn } = await createUploadUrl(
      { userId: USER, contentType: "image/png", size: 1234 },
      parseStorageEnv(env),
    );
    const url = new URL(uploadUrl);
    expect(url.host).toBe(`${env.R2_BUCKET}.${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
    expect(decodeURIComponent(url.pathname.slice(1))).toBe(key);
    expect(key).toMatch(new RegExp(`^incoming/${USER}/[0-9a-f-]{36}\\.png$`));
    expect(expiresIn).toBe(300);
    expect(url.searchParams.get("X-Amz-Expires")).toBe("300");
    const signed = url.searchParams.get("X-Amz-SignedHeaders")?.split(";") ?? [];
    expect(signed).toEqual(expect.arrayContaining(["content-length", "content-type", "host"]));
  });

  it("never puts the secret key in the URL", async () => {
    const { uploadUrl } = await createUploadUrl(
      { userId: USER, contentType: "image/jpeg", size: 10 },
      parseStorageEnv(env),
    );
    expect(uploadUrl).not.toContain(env.R2_SECRET_ACCESS_KEY);
  });

  it("names missing variables without showing values", () => {
    expect(() => parseStorageEnv({ ...env, R2_SECRET_ACCESS_KEY: undefined })).toThrow(/R2_SECRET_ACCESS_KEY/);
    try {
      parseStorageEnv({ ...env, R2_BUCKET: "" });
    } catch (e) {
      expect(String(e)).not.toContain(env.R2_SECRET_ACCESS_KEY);
    }
  });
});
