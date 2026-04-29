import { expect, test } from "@playwright/test";

test.describe("Authenticated teacher smoke", () => {
  test.skip(
    !process.env.PLAYWRIGHT_TEACHER_EMAIL ||
      !process.env.PLAYWRIGHT_TEACHER_PASSWORD,
    "Missing PLAYWRIGHT_TEACHER_EMAIL / PLAYWRIGHT_TEACHER_PASSWORD",
  );

  test("teacher events page is accessible when logged in", async ({ page }) => {
    await page.goto("/teacher/events");

    await expect(page).toHaveURL(/\/teacher\/events$/);
    await expect(
      page.getByRole("heading", { name: "Saját eseményeim" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Új esemény" }),
    ).toBeVisible();
  });
});
