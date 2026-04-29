import { expect, test } from "@playwright/test";

test.describe("Events route protection smoke", () => {
  test("events page redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/events");
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Bejelentkezés" }),
    ).toBeVisible();
  });

  test("event details route redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/events/1/details");
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Bejelentkezés" }),
    ).toBeVisible();
  });
});
