import { expect, test } from "@playwright/test";

test.describe("Teacher events route protection smoke", () => {
  test("teacher events page redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/teacher/events");

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Bejelentkezés" }),
    ).toBeVisible();
  });

  test("teacher event details route redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/teacher/events/1");

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Bejelentkezés" }),
    ).toBeVisible();
  });
});
