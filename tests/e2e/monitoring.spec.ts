import { expect, test } from "@playwright/test";

test("debug route is hidden from the public", async ({ request }) => {
  const res = await request.get("/api/debug/sentry-test");
  expect(res.status()).toBe(404);
});

test("home page loads without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});
