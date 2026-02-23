import { test, expect } from "@playwright/test";

test.describe("Responsive layout", () => {
  test("home page renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "AI学習ナビ", level: 1 })
    ).toBeVisible();
  });

  test("mobile menu toggle is visible on small screens", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(
      page.getByRole("button", { name: /メニュー/ })
    ).toBeVisible();
  });

  test("desktop nav is hidden on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(
      page.getByRole("navigation", { name: "メインナビゲーション" })
    ).toBeHidden();
  });

  test("mobile menu opens and shows navigation links", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await page.getByRole("button", { name: /メニュー/ }).click();

    const mobileNav = page.getByRole("navigation", {
      name: "モバイルナビゲーション",
    });
    await expect(mobileNav).toBeVisible();
    await expect(
      mobileNav.getByRole("link", { name: "動画を探す" })
    ).toBeVisible();
    await expect(
      mobileNav.getByRole("link", { name: "学習トラック" })
    ).toBeVisible();
  });

  test("videos page renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/videos");

    await expect(
      page.getByPlaceholder("キーワードで検索...")
    ).toBeVisible();
  });

  test("filter button is visible on mobile videos page", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/videos");

    await expect(
      page.getByRole("button", { name: /フィルター/ })
    ).toBeVisible();
  });
});
