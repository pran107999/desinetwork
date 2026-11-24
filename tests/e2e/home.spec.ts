import { expect, test } from "@playwright/test";

test("starter page loads with brand heading and Post button", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Desinetwork" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Post Free Ad" })).toBeVisible();

  // Nothing should overflow sideways at either viewport size.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
