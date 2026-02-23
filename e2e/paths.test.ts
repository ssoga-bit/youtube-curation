import { test, expect } from "@playwright/test";

test.describe("Paths page", () => {
  test("displays the page heading", async ({ page }) => {
    await page.goto("/paths");

    await expect(
      page.getByRole("heading", { name: "学習トラック", level: 1 })
    ).toBeVisible();
  });

  test("shows subtitle description", async ({ page }) => {
    await page.goto("/paths");

    await expect(
      page.locator("text=目的に合わせた学習パスで、効率よくスキルアップしましょう。")
    ).toBeVisible();
  });

  test("displays path cards or empty state", async ({ page }) => {
    await page.goto("/paths");

    const pathCard = page.locator("text=トラックを始める").first();
    const emptyState = page.locator("text=学習トラックはまだありません");

    await expect(pathCard.or(emptyState)).toBeVisible();
  });
});
