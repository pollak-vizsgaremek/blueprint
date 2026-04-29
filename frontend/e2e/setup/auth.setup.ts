import { expect, Page, test } from "@playwright/test";
import fs from "fs";
import path from "path";

const authDir = path.resolve("e2e/.auth");

const loginAndStoreState = async (
  page: Page,
  credentials: { email?: string; password?: string },
  stateFileName: string,
) => {
  const { email, password } = credentials;

  test.skip(!email || !password, `Missing credentials for ${stateFileName}`);

  fs.mkdirSync(authDir, { recursive: true });

  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email as string);
  await page.locator('input[type="password"]').fill(password as string);
  await page.getByRole("button", { name: "Bejelentkezés" }).click();

  await expect(page).toHaveURL(/^((?!\/login).)*$/);
  await page
    .context()
    .storageState({ path: path.join(authDir, stateFileName) });
};

test("create storage state for seeded user", async ({ page }) => {
  await loginAndStoreState(
    page,
    {
      email: process.env.PLAYWRIGHT_USER_EMAIL,
      password: process.env.PLAYWRIGHT_USER_PASSWORD,
    },
    "user.json",
  );
});

test("create storage state for seeded teacher", async ({ page }) => {
  await loginAndStoreState(
    page,
    {
      email: process.env.PLAYWRIGHT_TEACHER_EMAIL,
      password: process.env.PLAYWRIGHT_TEACHER_PASSWORD,
    },
    "teacher.json",
  );
});
