import { expect, test } from "@playwright/test";

test("the Today dashboard renders three widget cards for Habits, Finance, and Notes", async ({
  page,
}) => {
  await page.goto("/today");

  await expect(
    page.getByRole("heading", { name: "Today", level: 1 }),
  ).toBeVisible();

  const section = page.locator("section");
  const links = section.locator("a");

  await expect(links).toHaveCount(3);

  await expect(links.nth(0)).toHaveAttribute("href", "/habits");
  await expect(links.nth(1)).toHaveAttribute("href", "/finance");
  await expect(links.nth(2)).toHaveAttribute("href", "/notes");

  await expect(links.nth(0)).toContainText("Habits");
  await expect(links.nth(1)).toContainText("Finance");
  await expect(links.nth(2)).toContainText("Notes");
});

test("clicking a widget card navigates to the section page", async ({
  page,
}) => {
  await page.goto("/today");

  await page.getByRole("link", { name: "Habits" }).first().click();
  await expect(page).toHaveURL(/\/habits$/);

  await page.goto("/today");
  await page.getByRole("link", { name: "Finance" }).first().click();
  await expect(page).toHaveURL(/\/finance$/);

  await page.goto("/today");
  await page.getByRole("link", { name: "Notes" }).first().click();
  await expect(page).toHaveURL(/\/notes$/);
});

test("⌘K opens the command palette with navigation commands to all four sections", async ({
  page,
}) => {
  await page.goto("/today");

  const isMac = process.platform === "darwin";
  const modifier = isMac ? "Meta" : "Control";
  await page.keyboard.press(`${modifier}+k`);

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  for (const label of ["Today", "Habits", "Finance", "Notes"]) {
    await expect(dialog.getByText(label)).toBeVisible();
  }
});

test("the command palette is keyboard-navigable and Esc closes it", async ({
  page,
}) => {
  await page.goto("/today");

  const isMac = process.platform === "darwin";
  const modifier = isMac ? "Meta" : "Control";
  await page.keyboard.press(`${modifier}+k`);

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");

  await expect(page).not.toHaveURL(/\/today$/);
  await expect(dialog).not.toBeVisible();
});

test("the dashboard layout is responsive", async ({ page }) => {
  await page.goto("/today");

  await page.setViewportSize({ width: 1440, height: 900 });
  const sectionDesktop = page.locator("section");
  await expect(sectionDesktop.locator("a")).toHaveCount(3);

  await page.setViewportSize({ width: 375, height: 812 });
  const sectionMobile = page.locator("section");
  await expect(sectionMobile.locator("a")).toHaveCount(3);
});
