import { test, expect } from "@playwright/test";

test.describe("Auth signin page", () => {
  test("displays the signin page heading", async ({ page }) => {
    await page.goto("/auth/signin");

    await expect(
      page.getByRole("heading", { name: "AI学習ナビ", level: 1 })
    ).toBeVisible();
  });

  test("shows login subtitle", async ({ page }) => {
    await page.goto("/auth/signin");

    await expect(
      page.locator("text=ログインして学習の進捗を記録しましょう")
    ).toBeVisible();
  });

  test("displays Google login button", async ({ page }) => {
    await page.goto("/auth/signin");

    await expect(
      page.getByRole("button", { name: /Googleでログイン/ })
    ).toBeVisible();
  });

  test("displays demo login buttons", async ({ page }) => {
    await page.goto("/auth/signin");

    await expect(
      page.getByRole("button", { name: "デモユーザー" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "管理者" })
    ).toBeVisible();
  });
});
