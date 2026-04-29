import { expect, test } from "@playwright/test";

test.describe("Auth smoke", () => {
  test("login page renders required fields", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Bejelentkezés" }),
    ).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Bejelentkezés" }),
    ).toBeVisible();
  });

  test("forgot password page is reachable from login", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Elfelejtett jelszó?" }).click();

    await expect(page).toHaveURL(/\/forgot-password$/);
  });
});
