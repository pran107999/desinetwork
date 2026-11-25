// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

// The route's auth and storage calls are replaced so its rules can be tested
// without a browser session. Real sign-in is covered once login exists (T2.1).
const getUser = vi.fn();
const profileSingle = vi.fn();
vi.mock("@/lib/db/server", () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ single: profileSingle }) }) }),
  }),
}));
const createUploadUrl = vi.fn();
vi.mock("@/lib/storage/r2", () => ({ createUploadUrl: (...a: unknown[]) => createUploadUrl(...a) }));

const { POST } = await import("@/app/api/uploads/sign/route");

const USER = "6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";
const req = (body: unknown) =>
  new Request("http://localhost/api/uploads/sign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: USER } }, error: null });
  profileSingle.mockResolvedValue({ data: { status: "active" }, error: null });
  createUploadUrl.mockResolvedValue({ uploadUrl: "https://r2.test/put", key: `incoming/${USER}/k.png`, expiresIn: 300 });
});

describe("POST /api/uploads/sign (A0.7)", () => {
  it("returns 401 for signed-out visitors and does not sign anything", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(req({ contentType: "image/png", size: 100 }));
    expect(res.status).toBe(401);
    expect(createUploadUrl).not.toHaveBeenCalled();
  });

  it("returns 403 for suspended or banned users", async () => {
    profileSingle.mockResolvedValue({ data: { status: "banned" }, error: null });
    const res = await POST(req({ contentType: "image/png", size: 100 }));
    expect(res.status).toBe(403);
    expect(createUploadUrl).not.toHaveBeenCalled();
  });

  it("returns 400 with a clear message for a bad type, size or body", async () => {
    const gif = await POST(req({ contentType: "image/gif", size: 100 }));
    expect(gif.status).toBe(400);
    expect(await gif.json()).toEqual({ error: "Only JPG, PNG or WebP photos can be uploaded." });
    expect((await POST(req({ contentType: "image/png", size: 11 * 1024 * 1024 }))).status).toBe(400);
    expect((await POST(req("not json"))).status).toBe(400);
    expect(createUploadUrl).not.toHaveBeenCalled();
  });

  it("signs an upload for the signed-in user only (user id from the session, not the body)", async () => {
    const res = await POST(req({ contentType: "image/png", size: 100, userId: "someone-else" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(await res.json()).toEqual({ uploadUrl: "https://r2.test/put", key: `incoming/${USER}/k.png`, expiresIn: 300 });
    expect(createUploadUrl).toHaveBeenCalledWith({ userId: USER, contentType: "image/png", size: 100 });
  });

  it("returns 503 without details when storage is not configured", async () => {
    createUploadUrl.mockRejectedValue(new Error("Invalid storage environment: R2_BUCKET is missing"));
    const res = await POST(req({ contentType: "image/png", size: 100 }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Photo uploads are not available right now." });
  });
});
