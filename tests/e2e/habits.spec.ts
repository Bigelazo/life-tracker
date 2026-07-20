import { expect, test } from "@playwright/test";

const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

test("can create a new habit from the UI", async ({ page }) => {
  await page.goto("/habits");
  await expect(
    page.getByRole("heading", { name: "Habits", level: 1 }),
  ).toBeVisible();

  await page.getByText("+ New habit").click();

  const nameInput = page.getByPlaceholder("Habit name");
  await expect(nameInput).toBeVisible();
  const name = `Exercise ${unique()}`;
  await nameInput.fill(name);

  await page.getByRole("button", { name: "Create" }).click();

  await expect(page.getByText(name, { exact: true })).toBeVisible();
});

test("can check off and uncheck a habit", async ({ page }) => {
  await page.goto("/habits");

  const name = `Read ${unique()}`;
  await page.getByText("+ New habit").click();
  await page.getByPlaceholder("Habit name").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  const link = page.getByRole("link", { name: `View details for ${name}` });
  const card = link.locator("xpath=ancestor::div[contains(@class, 'rounded-lg')][1]");

  const checkResponse = page.waitForResponse(
    (res) =>
      res.url().includes("/api/habits/") &&
      res.url().includes("/log") &&
      res.request().method() === "POST",
  );
  await card.getByLabel(`Mark ${name} as done`).click();
  await checkResponse;

  await page.reload();
  await expect(
    page.getByLabel(`Unmark ${name} as done`),
  ).toBeVisible();

  // Uncheck
  const uncheckResponse = page.waitForResponse(
    (res) =>
      res.url().includes("/api/habits/") &&
      res.url().includes("/log") &&
      res.request().method() === "DELETE",
  );
  await page.getByLabel(`Unmark ${name} as done`).click();
  await uncheckResponse;

  await expect(page.getByLabel(`Mark ${name} as done`)).toBeVisible();

  await page.reload();
  await expect(page.getByLabel(`Mark ${name} as done`)).toBeVisible();
});

test("can edit a habit name and description", async ({ page }) => {
  await page.goto("/habits");

  const name = `Meditate ${unique()}`;
  await page.getByText("+ New habit").click();
  await page.getByPlaceholder("Habit name").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  const link = page.getByRole("link", { name: `View details for ${name}` });
  const card = link.locator("xpath=ancestor::div[contains(@class, 'rounded-lg')][1]");
  await card.locator("button", { hasText: "Edit" }).click();
  const nameInput = page.getByPlaceholder("Habit name");
  const descInput = page.getByPlaceholder("Description (optional)");

  const renamed = `${name} twice`;
  const desc = `Morning and evening ${unique()}`;
  await nameInput.fill(renamed);
  await descInput.fill(desc);
  await page.getByRole("button", { name: "Save" }).click();

  await expect(
    page.getByText(renamed, { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(desc)).toBeVisible();
});

test("can archive a habit", async ({ page }) => {
  await page.goto("/habits");

  const name = `Journal ${unique()}`;
  await page.getByText("+ New habit").click();
  await page.getByPlaceholder("Habit name").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  const link = page.getByRole("link", { name: `View details for ${name}` });
  const card = link.locator("xpath=ancestor::div[contains(@class, 'rounded-lg')][1]");
  await card.locator("button", { hasText: "Archive" }).click();

  await expect(
    page.getByText(name, { exact: true }),
  ).not.toBeVisible();
});

test("habit card links to a detail page with stats and year heatmap", async ({ page }) => {
  await page.goto("/habits");

  const name = `Detail Habit ${unique()}`;
  await page.getByText("+ New habit").click();
  await page.getByPlaceholder("Habit name").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  await page.getByRole("link", { name: `View details for ${name}` }).click();

  await expect(page).toHaveURL(/\/habits\/.+/);
  await expect(
    page.getByRole("heading", { name, level: 1 }),
  ).toBeVisible();

  await expect(page.getByText("Current streak", { exact: true })).toBeVisible();
  await expect(page.getByText("Best streak", { exact: true })).toBeVisible();
  await expect(page.getByText(/^Completion · \d{4}$/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Year heatmap" })).toBeVisible();
  await expect(page.getByText("Done", { exact: true })).toBeVisible();
  await expect(page.getByText("Missed", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: /Back to habits/ }).click();
  await expect(page).toHaveURL(/\/habits$/);
});

test("negative habit detail page shows relapse stats instead of streaks", async ({ page }) => {
  await page.goto("/habits");

  const name = `Quit smoking ${unique()}`;
  await page.getByText("+ New habit").click();
  await page.getByPlaceholder("Habit name").fill(name);
  await page.getByRole("button", { name: "Quit", exact: true }).click();
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  await page.getByRole("link", { name: `View details for ${name}` }).click();

  await expect(
    page.getByRole("heading", { name, level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Since last relapse", { exact: true })).toBeVisible();
  await expect(page.getByText("Relapses", { exact: true })).toBeVisible();
  await expect(page.getByText("Tracking since", { exact: true })).toBeVisible();
});
