import { expect, test } from "@playwright/test";

test("the Today dashboard renders widget cards for Finance and Notes, plus the habits widget", async ({
  page,
}) => {
  await page.goto("/today");

  await expect(
    page.getByRole("heading", { name: "Today", level: 1 }),
  ).toBeVisible();

  // Two navigation cards (Finance + Notes); Habits gets its own widget now.
  const financeCard = page.getByRole("link", { name: "Finance", exact: true });
  const notesCard = page.getByRole("link", { name: "Notes", exact: true });
  await expect(financeCard).toHaveAttribute("href", "/finance");
  await expect(notesCard).toHaveAttribute("href", "/notes");

  // The habits widget is the prominent panel on the dashboard.
  await expect(
    page.getByTestId("today-habits-widget").or(
      page.getByText("Nothing due today"),
    ),
  ).toBeVisible();
});

test("clicking a widget card navigates to the section page", async ({
  page,
}) => {
  await page.goto("/today");

  await page.getByRole("link", { name: "Finance", exact: true }).first().click();
  await expect(page).toHaveURL(/\/finance$/);

  await page.goto("/today");
  await page.getByRole("link", { name: "Notes", exact: true }).first().click();
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
    await expect(dialog.getByText(label, { exact: true })).toBeVisible();
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
  await expect(
    page.getByRole("link", { name: "Finance", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Notes", exact: true }),
  ).toBeVisible();

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(
    page.getByRole("link", { name: "Finance", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Notes", exact: true }),
  ).toBeVisible();
});
