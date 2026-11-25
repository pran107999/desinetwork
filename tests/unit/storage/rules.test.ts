import { describe, expect, it } from "vitest";
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_URL_TTL_SECONDS,
  buildUploadKey,
  parseUploadRequest,
} from "@/lib/storage/rules";

const USER = "6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";

describe("upload rules (A0.7)", () => {
  it("accepts jpg, png and webp up to 10 MB", () => {
    for (const contentType of ["image/jpeg", "image/png", "image/webp"]) {
      expect(parseUploadRequest({ contentType, size: MAX_UPLOAD_BYTES })).toEqual({
        ok: true,
        value: { contentType, size: MAX_UPLOAD_BYTES },
      });
    }
    expect(MAX_UPLOAD_BYTES).toBe(10 * 1024 * 1024);
  });

  it("rejects other file types with a clear message", () => {
    const r = parseUploadRequest({ contentType: "image/gif", size: 1000 });
    expect(r).toEqual({ ok: false, error: "Only JPG, PNG or WebP photos can be uploaded." });
  });

  it("rejects files over 10 MB, empty files and bad sizes", () => {
    expect(parseUploadRequest({ contentType: "image/png", size: MAX_UPLOAD_BYTES + 1 })).toEqual({
      ok: false,
      error: "Photos must be 10 MB or smaller.",
    });
    expect(parseUploadRequest({ contentType: "image/png", size: 0 }).ok).toBe(false);
    expect(parseUploadRequest({ contentType: "image/png", size: 1.5 }).ok).toBe(false);
    expect(parseUploadRequest({ contentType: "image/png" }).ok).toBe(false);
    expect(parseUploadRequest(null).ok).toBe(false);
  });

  it("builds a private, per-user key with the right extension", () => {
    expect(buildUploadKey(USER, "image/jpeg", "abc")).toBe(`incoming/${USER}/abc.jpg`);
    expect(buildUploadKey(USER, "image/png")).toMatch(
      new RegExp(`^incoming/${USER}/[0-9a-f-]{36}\\.png$`),
    );
    expect(buildUploadKey(USER, "image/webp", "x")).toBe(`incoming/${USER}/x.webp`);
  });

  it("refuses a user id that is not a UUID (no path tricks)", () => {
    expect(() => buildUploadKey("../other", "image/png")).toThrow();
  });

  it("signed upload links expire after 5 minutes", () => {
    expect(UPLOAD_URL_TTL_SECONDS).toBe(300);
  });
});
