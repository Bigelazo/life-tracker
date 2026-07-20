import { expect, test, type Page } from "@playwright/test";

const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

async function createBooleanHabit(page: Page, name: string) {
  await page.goto("/habits");
  await page.getByText("+ New habit").click();
  await page.getByPlaceholder("Habit name").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}

async function createQuantifiableHabit(
  page: Page,
  name: string,
  target: string,
  unit: string,
) {
  await page.goto("/habits");
  await page.getByText("+ New habit").click();
  await page.getByPlaceholder("Habit name").fill(name);
  await page.getByText("Quantifiable habit").click();
  await page.getByPlaceholder("Target").fill(target);
  await page.getByPlaceholder("Unit").fill(unit);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}

async function openPalette(page: Page) {
  const isMac = process.platform === "darwin";
  const modifier = isMac ? "Meta" : "Control";
  await page.keyboard.press(`${modifier}+k`);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

test("the Today dashboard renders the habits widget or its empty state", async ({
  page,
}) => {
  await page.goto("/today");

  // The widget renders either the populated panel or the empty state.
  const widget = page
    .getByTestId("today-habits-widget")
    .or(page.getByText("Nothing due today"));
  await expect(widget).toBeVisible();
});

test("checking off a habit on the Today dashboard persists across reload", async ({
  page,
}) => {
  const name = `Today Test ${unique()}`;
  await createBooleanHabit(page, name);

  await page.goto("/today");
  const row = page
    .getByTestId("today-habits-widget")
    .locator("li")
    .filter({ hasText: name });
  const checkbox = row.getByRole("checkbox");
  await expect(checkbox).toHaveAttribute("aria-checked", "false");
  await checkbox.click();

  // Optimistic update is visible immediately.
  await expect(checkbox).toHaveAttribute("aria-checked", "true");

  // Wait for the POST to settle so reload doesn't lose the optimistic
  // update — the request might still be in flight when we reload.
  const postResponse = await page.waitForResponse(
    (res) =>
      res.url().includes("/api/habits/") &&
      res.url().endsWith("/log") &&
      res.request().method() === "POST",
  );
  expect(postResponse.ok()).toBe(true);

  // Reload — the check survives.
  await page.reload();
  const rowAfter = page
    .getByTestId("today-habits-widget")
    .locator("li")
    .filter({ hasText: name });
  await expect(rowAfter.getByRole("checkbox")).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("the Today habits widget links each row to the habit detail page", async ({
  page,
}) => {
  const name = `Linkable ${unique()}`;
  await createBooleanHabit(page, name);

  await page.goto("/today");
  const link = page.getByRole("link", { name: `View details for ${name}` });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/habits\/.+/);
  await expect(
    page.getByRole("heading", { name, level: 1 }),
  ).toBeVisible();
});

test("the Today habits widget shows the '+1' quick action for quantifiable habits", async ({
  page,
}) => {
  const name = `Water ${unique()}`;
  await createQuantifiableHabit(page, name, "2", "L");

  await page.goto("/today");
  const row = page
    .getByTestId("today-habits-widget")
    .locator("li")
    .filter({ hasText: name });
  await expect(row).toBeVisible();
  await expect(row.getByText("0 / 2 L")).toBeVisible();

  const addButton = row.getByTestId("habit-add-amount");
  await addButton.click();

  // After the optimistic update, the cumulative amount is 1.
  await expect(row.getByText("1 / 2 L")).toBeVisible();

  // Wait for the POST to settle before reloading — the test DB is shared
  // with other specs, so we want a stable baseline.
  await page.waitForResponse(
    (res) => res.url().includes("/api/habits/") && res.url().endsWith("/log") && res.request().method() === "POST",
  );

  await page.reload();
  await expect(row.getByText("1 / 2 L")).toBeVisible();
});

test("⌘K offers 'Check off <habit>' for each due positive habit", async ({
  page,
}) => {
  const name = `CmdK Check ${unique()}`;
  await createBooleanHabit(page, name);

  await page.goto("/today");
  const dialog = await openPalette(page);

  // Type the exact command label so the list filters to a single match.
  // Then click that single remaining option — the list is short enough
  // that the click target is always on screen, and this is more reliable
  // than relying on cmdk's Enter-to-activate keyboard handler.
  const search = dialog.getByPlaceholder("Type a command or search…");
  await search.fill(`Check off ${name}`);
  const option = dialog
    .getByRole("option")
    .filter({ hasText: `Check off ${name}` })
    .first();
  await expect(option).toBeVisible();
  await option.click();

  // Palette closes; the habit is now checked off on the Today widget.
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByLabel(`Unmark ${name} as done`),
  ).toBeVisible();

  // And it persists across reload.
  await page.waitForResponse(
    (res) =>
      res.url().includes("/api/habits/") &&
      res.url().endsWith("/log") &&
      res.request().method() === "POST",
  );
  await page.reload();
  await expect(
    page.getByLabel(`Unmark ${name} as done`),
  ).toBeVisible();
});

test("⌘K offers 'Go to <habit>' for every habit and navigates to its detail page", async ({
  page,
}) => {
  const name = `CmdK Go ${unique()}`;
  await createBooleanHabit(page, name);

  await page.goto("/today");
  const dialog = await openPalette(page);

  // Filter the list down to the one "Go to" option for our habit and
  // click it. The single remaining option always fits inside the list
  // viewport, so the click target is always on screen.
  const search = dialog.getByPlaceholder("Type a command or search…");
  await search.fill(`Go to ${name}`);
  const option = dialog
    .getByRole("option")
    .filter({ hasText: `Go to ${name}` })
    .first();
  await expect(option).toBeVisible();
  await option.click();

  await expect(page).toHaveURL(/\/habits\/.+/);
  await expect(
    page.getByRole("heading", { name, level: 1 }),
  ).toBeVisible();
});
