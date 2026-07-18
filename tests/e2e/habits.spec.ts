import { expect, test } from "@playwright/test";

test("can create a new habit from the UI", async ({ page }) => {
  await page.goto("/habits");
  await expect(
    page.getByRole("heading", { name: "Habits", level: 1 }),
  ).toBeVisible();

  await page.getByText("+ New habit").click();

  const nameInput = page.getByPlaceholder("Habit name");
  await expect(nameInput).toBeVisible();
  await nameInput.fill("Exercise");

  await page.getByRole("button", { name: "Create" }).click();

  await expect(page.getByText("Exercise", { exact: true })).toBeVisible();
});

test("can check off and uncheck a habit", async ({ page }) => {
  await page.goto("/habits");

  await page.getByText("+ New habit").click();
  await page.getByPlaceholder("Habit name").fill("Read");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Read", { exact: true })).toBeVisible();

  const checkbox = page.getByLabel("Mark Read as done");
  await checkbox.click();

  // Wait for optimistic update
  await expect(checkbox).toHaveAttribute("aria-label", "Unmark Read as done");

  await page.reload();
  await expect(
    page.getByLabel("Unmark Read as done"),
  ).toBeVisible();

  // Uncheck
  await page.getByLabel("Unmark Read as done").click();
  await expect(page.getByLabel("Mark Read as done")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Mark Read as done")).toBeVisible();
});

test("can edit a habit name and description", async ({ page }) => {
  await page.goto("/habits");

  await page.getByText("+ New habit").click();
  await page.getByPlaceholder("Habit name").fill("Meditate");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Meditate", { exact: true })).toBeVisible();

  await page.getByText("Edit").click();
  const nameInput = page.getByPlaceholder("Habit name");
  const descInput = page.getByPlaceholder("Description (optional)");

  await nameInput.fill("Meditate twice");
  await descInput.fill("Morning and evening");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(
    page.getByText("Meditate twice", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Morning and evening")).toBeVisible();
});

test("can archive a habit", async ({ page }) => {
  await page.goto("/habits");

  await page.getByText("+ New habit").click();
  await page.getByPlaceholder("Habit name").fill("Journal");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Journal", { exact: true })).toBeVisible();

  await page.getByText("Archive").click();

  await expect(
    page.getByText("Journal", { exact: true }),
  ).not.toBeVisible();
});
