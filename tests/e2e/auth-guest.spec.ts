import { expect, test } from "@playwright/test";

test("a visitor without a session is sent to /login from every section", async ({
  page,
}) => {
  for (const path of ["/", "/today", "/habits", "/finance", "/notes"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login(\?|$)/);
    await expect(
      page.getByRole("heading", { name: "Sign in", level: 1 }),
    ).toBeVisible();
  }
});

test("the login page shows the Google CTA and offers the test path", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: "Sign in with Google", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in (test owner)", exact: true }),
  ).toBeVisible();
});

test("a non-owner Google account is rejected with a clear message", async ({
  page,
}) => {
  await page.goto("/login?error=AccessDenied");
  await expect(
    page.getByRole("heading", { name: "Sign in", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText(/That Google account isn't the owner/),
  ).toBeVisible();
});