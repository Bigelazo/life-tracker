import { expect, test } from "@playwright/test";

test("authenticate as the owner via the test-only path", async ({ page }) => {
  await page.goto("/login");

  await page
    .getByRole("button", { name: "Sign in (test owner)", exact: true })
    .click();

  await page.waitForURL(/\/today$/, { timeout: 15_000 });

  await expect(
    page.getByRole("heading", { name: "Today", level: 1 }),
  ).toBeVisible();

  await page.context().storageState({ path: "tests/e2e/.auth/session.json" });
});