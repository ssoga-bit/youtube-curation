import { test, expect } from "@playwright/test";

test.describe("Videos filter and sort", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/videos");
  });

  test("sort dropdown is visible and has options", async ({ page }) => {
    const sortSelect = page.locator("select");
    await expect(sortSelect).toBeVisible();

    const options = sortSelect.locator("option");
    await expect(options).toHaveCount(4);
    await expect(options.nth(0)).toHaveText("BCI順");
    await expect(options.nth(1)).toHaveText("新しい順");
    await expect(options.nth(2)).toHaveText("人気順");
    await expect(options.nth(3)).toHaveText("おすすめ順");
  });

  test("sort dropdown can be changed", async ({ page }) => {
    const sortSelect = page.locator("select");
    await sortSelect.selectOption("newest");
    await expect(sortSelect).toHaveValue("newest");
  });

  test("search input accepts text", async ({ page }) => {
    const searchInput = page.getByPlaceholder("キーワードで検索...");
    await expect(searchInput).toBeVisible();

    await searchInput.fill("Python");
    await expect(searchInput).toHaveValue("Python");
  });

  test("filter sidebar is visible on desktop", async ({ page }) => {
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
  });

  test("results count or loading indicator is displayed", async ({ page }) => {
    await expect(
      page.locator("text=/件の動画|読み込み中/")
    ).toBeVisible();
  });
});
