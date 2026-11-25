import { expect, test } from "@playwright/test";

test("signed-out visitors cannot get an upload link", async ({ request }) => {
  const res = await request.post("/api/uploads/sign", { data: { contentType: "image/png", size: 100 } });
  expect(res.status()).toBe(401);
  const body = await res.json();
  expect(body).toEqual({ error: "Please sign in to upload photos." });
  expect(JSON.stringify(body)).not.toMatch(/r2\.cloudflarestorage|X-Amz/);
});
