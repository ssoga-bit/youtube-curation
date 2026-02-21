import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("displays the AI学習ナビ heading", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "AI学習ナビ", level: 1 })
    ).toBeVisible();
  });
});
