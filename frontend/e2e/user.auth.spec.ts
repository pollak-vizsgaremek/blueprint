import { expect, test } from "@playwright/test";

test.describe("Authenticated user smoke", () => {
  test.skip(
    !process.env.PLAYWRIGHT_USER_EMAIL || !process.env.PLAYWRIGHT_USER_PASSWORD,
    "Missing PLAYWRIGHT_USER_EMAIL / PLAYWRIGHT_USER_PASSWORD",
  );

  test("events page is accessible when logged in", async ({ page }) => {
    await page.goto("/events");

    await expect(page).toHaveURL(/\/events$/);
    await expect(
      page.getByRole("heading", { name: "Események" }),
    ).toBeVisible();
  });

  test("appointments page is accessible when logged in", async ({ page }) => {
    await page.goto("/appointments");

    await expect(page).toHaveURL(/\/appointments$/);
    await expect(
      page.getByRole("heading", { name: "Időpontok" }),
    ).toBeVisible();
  });
});
