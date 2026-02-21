import { test, expect } from "@playwright/test";

test.describe("Videos page", () => {
  test("renders the search input and results area", async ({ page }) => {
    await page.goto("/videos");

    // The search input is always rendered regardless of auth or data state
    await expect(
      page.getByPlaceholder("キーワードで検索...")
    ).toBeVisible();

    // The results count element is always rendered (shows loading or count)
    await expect(page.locator("text=/件の動画|読み込み中/")).toBeVisible();
  });
});
