import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { HabitLogResponse, HabitResponse, RelapseResponse } from "@/habits/api-types";

const useHabitsMock = vi.fn<() => { data: HabitResponse[] | undefined }>();
const useHabitLogsMock = vi.fn<() => { data: HabitLogResponse[] | undefined }>();
const useAllRelapsesMock = vi.fn<() => { data: RelapseResponse[] | undefined }>();
const useSettingsMock = vi.fn<() => { data: { timezone: string; currency: string } | undefined }>();
const useCheckHabitMock = vi.fn(() => ({ mutate: vi.fn() }));
const useUncheckHabitMock = vi.fn(() => ({ mutate: vi.fn() }));

vi.mock("@/habits/hooks", () => ({
  useHabits: () => useHabitsMock(),
  useHabitLogs: () => useHabitLogsMock(),
  useAllRelapses: () => useAllRelapsesMock(),
  useSettings: () => useSettingsMock(),
  useCheckHabit: () => useCheckHabitMock(),
  useUncheckHabit: () => useUncheckHabitMock(),
}));

import { TodayHabitsWidget } from "./today-habits-widget";

function habit(overrides: Partial<HabitResponse> & { id: string; name: string }): HabitResponse {
  return {
    id: overrides.id,
    name: overrides.name,
    description: overrides.description ?? null,
    archived: overrides.archived ?? false,
    habitType: overrides.habitType ?? "positive",
    frequency: overrides.frequency ?? { type: "daily" },
    target: overrides.target ?? null,
    unit: overrides.unit ?? null,
    createdAt: overrides.createdAt ?? "2026-01-01T00:00:00Z",
    updatedAt: overrides.updatedAt ?? "2026-01-01T00:00:00Z",
  };
}

function log(
  habitId: string,
  logDate: string,
  amount = 1,
): HabitLogResponse {
  return {
    id: `log-${habitId}-${logDate}-${amount}`,
    habitId,
    logDate,
    amount,
    createdAt: "2026-07-18T12:00:00Z",
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-18T12:00:00Z"));
  useHabitsMock.mockReturnValue({ data: [] });
  useHabitLogsMock.mockReturnValue({ data: [] });
  useAllRelapsesMock.mockReturnValue({ data: [] });
  useSettingsMock.mockReturnValue({ data: { timezone: "UTC", currency: "EUR" } });
  useCheckHabitMock.mockReturnValue({ mutate: vi.fn() });
  useUncheckHabitMock.mockReturnValue({ mutate: vi.fn() });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("TodayHabitsWidget", () => {
  it("shows the empty state when no habits are due", () => {
    useHabitsMock.mockReturnValue({ data: [] });
    render(<TodayHabitsWidget />);
    expect(screen.getByText("Nothing due today")).toBeInTheDocument();
    expect(screen.getByText(/You're caught up/i)).toBeInTheDocument();
  });

  it("shows the empty state when all habits are archived", () => {
    useHabitsMock.mockReturnValue({
      data: [habit({ id: "1", name: "Read", archived: true })],
    });
    render(<TodayHabitsWidget />);
    expect(screen.getByText("Nothing due today")).toBeInTheDocument();
  });

  it("renders due habits with a header summary of completed vs total", () => {
    useHabitsMock.mockReturnValue({
      data: [
        habit({ id: "1", name: "Meditate" }),
        habit({ id: "2", name: "Read" }),
        habit({ id: "3", name: "Workout" }),
      ],
    });
    useHabitLogsMock.mockReturnValue({
      data: [log("2", "2026-07-18")],
    });
    render(<TodayHabitsWidget />);
    expect(screen.getByText("Today's habits")).toBeInTheDocument();
    expect(screen.getByText("1 of 3 done")).toBeInTheDocument();
  });

  it("renders a checkbox for each due boolean habit", () => {
    useHabitsMock.mockReturnValue({
      data: [habit({ id: "1", name: "Meditate" })],
    });
    render(<TodayHabitsWidget />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(1);
    expect(checkboxes[0]).toHaveAttribute("aria-label", "Mark Meditate as done");
    expect(checkboxes[0]).toHaveAttribute("aria-checked", "false");
  });

  it("marks a habit done when the server reports a log for today", () => {
    useHabitsMock.mockReturnValue({
      data: [habit({ id: "1", name: "Meditate" })],
    });
    useHabitLogsMock.mockReturnValue({ data: [log("1", "2026-07-18")] });
    render(<TodayHabitsWidget />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-checked", "true");
    expect(checkbox).toHaveAttribute("aria-label", "Unmark Meditate as done");
  });

  it("calls the check mutation when an unchecked boolean habit is clicked", () => {
    const mutate = vi.fn();
    useCheckHabitMock.mockReturnValue({ mutate });
    useHabitsMock.mockReturnValue({
      data: [habit({ id: "habit-xyz", name: "Meditate" })],
    });
    render(<TodayHabitsWidget />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(mutate).toHaveBeenCalledWith({
      habitId: "habit-xyz",
      logDate: "2026-07-18",
    });
  });

  it("calls the uncheck mutation when a checked boolean habit is clicked", () => {
    const mutate = vi.fn();
    useUncheckHabitMock.mockReturnValue({ mutate });
    useHabitsMock.mockReturnValue({
      data: [habit({ id: "habit-xyz", name: "Meditate" })],
    });
    useHabitLogsMock.mockReturnValue({ data: [log("habit-xyz", "2026-07-18")] });
    render(<TodayHabitsWidget />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(mutate).toHaveBeenCalledWith({
      habitId: "habit-xyz",
      logDate: "2026-07-18",
    });
  });

  it("renders a progress bar and +1 button for quantifiable habits", () => {
    useHabitsMock.mockReturnValue({
      data: [
        habit({
          id: "water",
          name: "Water",
          target: 2,
          unit: "L",
          habitType: "positive",
        }),
      ],
    });
    render(<TodayHabitsWidget />);
    expect(screen.getByText("0 / 2 L")).toBeInTheDocument();
    const addButton = screen.getByTestId("habit-add-amount");
    expect(addButton).toBeInTheDocument();
  });

  it("opens an AlertDialog when the add-amount button is clicked", () => {
    useHabitsMock.mockReturnValue({
      data: [
        habit({
          id: "water",
          name: "Water",
          target: 2,
          unit: "L",
        }),
      ],
    });
    render(<TodayHabitsWidget />);
    fireEvent.click(screen.getByTestId("habit-add-amount"));
    expect(
      screen.getByRole("alertdialog"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Add amount for Water/)).toBeInTheDocument();
  });

  it("calls the check mutation with amount=1 when the dialog Add button is confirmed", () => {
    const mutate = vi.fn();
    useCheckHabitMock.mockReturnValue({ mutate });
    useHabitsMock.mockReturnValue({
      data: [
        habit({
          id: "water",
          name: "Water",
          target: 2,
          unit: "L",
        }),
      ],
    });
    render(<TodayHabitsWidget />);
    fireEvent.click(screen.getByTestId("habit-add-amount"));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(mutate).toHaveBeenCalledWith({
      habitId: "water",
      logDate: "2026-07-18",
      amount: 1,
    });
  });

  it("calls the check mutation with a custom amount when the dialog input is changed", () => {
    const mutate = vi.fn();
    useCheckHabitMock.mockReturnValue({ mutate });
    useHabitsMock.mockReturnValue({
      data: [
        habit({
          id: "water",
          name: "Water",
          target: 5,
          unit: "L",
        }),
      ],
    });
    render(<TodayHabitsWidget />);
    fireEvent.click(screen.getByTestId("habit-add-amount"));
    const input = screen.getByLabelText("Amount");
    fireEvent.change(input, { target: { value: "2.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(mutate).toHaveBeenCalledWith({
      habitId: "water",
      logDate: "2026-07-18",
      amount: 2.5,
    });
  });

  it("does not call the mutation when the dialog is cancelled", () => {
    const mutate = vi.fn();
    useCheckHabitMock.mockReturnValue({ mutate });
    useHabitsMock.mockReturnValue({
      data: [
        habit({
          id: "water",
          name: "Water",
          target: 2,
          unit: "L",
        }),
      ],
    });
    render(<TodayHabitsWidget />);
    fireEvent.click(screen.getByTestId("habit-add-amount"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mutate).not.toHaveBeenCalled();
  });

  it("marks a quantifiable habit done when the cumulative amount reaches the target", () => {
    useHabitsMock.mockReturnValue({
      data: [
        habit({
          id: "water",
          name: "Water",
          target: 2,
          unit: "L",
        }),
      ],
    });
    useHabitLogsMock.mockReturnValue({
      data: [log("water", "2026-07-18", 2)],
    });
    render(<TodayHabitsWidget />);
    expect(screen.getByText("2 / 2 L")).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-checked", "true");
  });

  it("renders a negative habit with elapsed time and no checkbox", () => {
    useHabitsMock.mockReturnValue({
      data: [
        habit({
          id: "neg",
          name: "Quit smoking",
          habitType: "negative",
        }),
      ],
    });
    useAllRelapsesMock.mockReturnValue({
      data: [
        {
          id: "r1",
          habitId: "neg",
          relapsedAt: "2026-07-17T12:00:00Z",
        },
      ],
    });
    render(<TodayHabitsWidget />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByText("1 day")).toBeInTheDocument();
  });

  it("links each habit name to its detail page", () => {
    useHabitsMock.mockReturnValue({
      data: [habit({ id: "habit-xyz", name: "Meditate" })],
    });
    render(<TodayHabitsWidget />);
    const link = screen.getByRole("link", { name: "View details for Meditate" });
    expect(link).toHaveAttribute("href", "/habits/habit-xyz");
  });

  it("shows a footer link to the full habits page", () => {
    useHabitsMock.mockReturnValue({
      data: [habit({ id: "1", name: "Meditate" })],
    });
    render(<TodayHabitsWidget />);
    const link = screen.getByRole("link", { name: /View all habits/ });
    expect(link).toHaveAttribute("href", "/habits");
  });
});
