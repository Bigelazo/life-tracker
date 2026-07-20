import { expect, test } from "@playwright/test";

test("a signed-in owner opens the app on the Today section", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/today$/);
  await expect(
    page.getByRole("heading", { name: "Today", level: 1 }),
  ).toBeVisible();
});

test("a signed-in owner reaches all four sections from the navigation", async ({
  page,
}) => {
  await page.goto("/today");
  const nav = page.getByRole("navigation", { name: "Sections" }).first();

  for (const label of ["Habits", "Finance", "Notes", "Today"]) {
    await nav.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${label.toLowerCase()}$`));
    await expect(
      page.getByRole("heading", { name: label, level: 1 }),
    ).toBeVisible();
  }
});

test("the PWA manifest is served with the canvas theme color", async ({
  request,
}) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();

  const manifest = await response.json();
  expect(manifest.name).toBe("Life Tracker");
  expect(manifest.display).toBe("standalone");
  // Notion-paper canvas is the canonical light theme; the dark variant
  // is advertised via <meta name="theme-color"> in the document.
  expect(manifest.theme_color).toBe("#f6f5f4");
  expect(manifest.background_color).toBe("#f6f5f4");
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
});

test("sign-out clears the session and re-gates the app", async ({ page }) => {
  await page.goto("/today");
  await expect(
    page.getByRole("heading", { name: "Today", level: 1 }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Sign out", exact: true }).click();

  await expect(page).toHaveURL(/\/login(\?|$)/);
  await expect(
    page.getByRole("heading", { name: "Sign in", level: 1 }),
  ).toBeVisible();

  // Re-gates: every protected route bounces back to /login after sign-out.
  await page.goto("/today");
  await expect(page).toHaveURL(/\/login(\?|$)/);
});
