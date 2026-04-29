import { expect, test } from "@playwright/test";

test.describe("Appointments route protection smoke", () => {
  test("appointments page redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/appointments");

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Bejelentkezés" }),
    ).toBeVisible();
  });
});
