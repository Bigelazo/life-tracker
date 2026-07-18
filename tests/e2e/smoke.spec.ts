import { expect, test } from "@playwright/test";

test("the app opens on the Today section", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/today$/);
  await expect(
    page.getByRole("heading", { name: "Today", level: 1 }),
  ).toBeVisible();
});

test("all four sections are reachable from the navigation", async ({
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
  expect(manifest.theme_color).toBe("#010102");
  expect(manifest.background_color).toBe("#010102");
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
});
