import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("header contains navigation links", async ({ page }) => {
    await page.goto("/");

    const nav = page.getByRole("navigation", { name: "メインナビゲーション" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "AI学習ナビ" })).toBeVisible();
    await expect(
      nav.getByRole("link", { name: "動画を探す" })
    ).toBeVisible();
    await expect(
      nav.getByRole("link", { name: "学習トラック" })
    ).toBeVisible();
  });

  test("clicking logo navigates to home", async ({ page }) => {
    await page.goto("/videos");

    await page
      .getByRole("navigation", { name: "メインナビゲーション" })
      .getByRole("link", { name: "AI学習ナビ" })
      .click();

    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: "AI学習ナビ", level: 1 })
    ).toBeVisible();
  });

  test("clicking 動画を探す navigates to videos page", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("navigation", { name: "メインナビゲーション" })
      .getByRole("link", { name: "動画を探す" })
      .click();

    await expect(page).toHaveURL("/videos");
    await expect(
      page.getByPlaceholder("キーワードで検索...")
    ).toBeVisible();
  });

  test("clicking 学習トラック navigates to paths page", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("navigation", { name: "メインナビゲーション" })
      .getByRole("link", { name: "学習トラック" })
      .click();

    await expect(page).toHaveURL("/paths");
    await expect(
      page.getByRole("heading", { name: "学習トラック", level: 1 })
    ).toBeVisible();
  });

  test("footer is visible on the page", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.locator("footer", { hasText: "AI学習ナビ" })
    ).toBeVisible();
  });
});
