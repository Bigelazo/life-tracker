import { describe, expect, it } from "vitest";
import {
  computeDueToday,
  computeProgress,
  computeStreak,
  isCompleteOnDate,
  todayDateString,
} from "./domain";
import type { HabitInput, HabitLogInput } from "./domain";

function habit(
  overrides: Partial<HabitInput> & { id: string; name: string },
): HabitInput {
  return {
    description: null,
    archived: false,
    frequency: { type: "daily" },
    target: null,
    unit: null,
    ...overrides,
  };
}

const TZ_NY = "America/New_York";
const TZ_TOKYO = "Asia/Tokyo";

function log(
  habitId: string,
  logDate: string,
  amount?: number,
): HabitLogInput {
  return { habitId, logDate, amount: amount ?? 1 };
}

describe("todayDateString", () => {
  it("returns today in the given timezone", () => {
    const now = new Date("2026-07-18T12:00:00Z");
    expect(todayDateString("UTC", now)).toBe("2026-07-18");
  });

  it("returns a different date at the UTC boundary", () => {
    const justAfterMidnight = new Date("2026-07-18T00:01:00Z");
    expect(todayDateString("UTC", justAfterMidnight)).toBe("2026-07-18");
    const justBeforeMidnight = new Date("2026-07-17T23:59:00Z");
    expect(todayDateString("UTC", justBeforeMidnight)).toBe("2026-07-17");
  });
});

describe("computeDueToday", () => {
  it("returns only non-archived habits with done flag", () => {
    const habits: HabitInput[] = [
      habit({ id: "1", name: "Exercise" }),
      habit({ id: "2", name: "Read", archived: true }),
      habit({ id: "3", name: "Meditate" }),
    ];
    const logs: HabitLogInput[] = [
      log("1", "2026-07-18"),
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    const result = computeDueToday(habits, logs, "UTC", now);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual({
      habit: expect.objectContaining({ id: "1", name: "Exercise" }),
      done: true,
    });
    expect(result).toContainEqual({
      habit: expect.objectContaining({ id: "3", name: "Meditate" }),
      done: false,
    });
  });

  it("uses timezone to determine today", () => {
    const habits: HabitInput[] = [
      habit({ id: "1", name: "Exercise" }),
    ];
    const logs: HabitLogInput[] = [
      log("1", "2026-07-17"),
    ];
    const now = new Date("2026-07-18T03:59:00Z");
    const result = computeDueToday(habits, logs, TZ_NY, now);
    expect(result[0].done).toBe(true);
  });

  it("returns empty for all-archived habits", () => {
    const habits: HabitInput[] = [
      habit({ id: "1", name: "Exercise", archived: true }),
    ];
    const logs: HabitLogInput[] = [];
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeDueToday(habits, logs, "UTC", now)).toHaveLength(0);
  });

  it("filters out habits not due on fixed weekdays", () => {
    const habits: HabitInput[] = [
      habit({
        id: "1",
        name: "Weekend run",
        frequency: { type: "fixed_weekdays", days: [0, 6] },
      }),
    ];
    const logs: HabitLogInput[] = [];
    const wednesday = new Date("2026-07-15T12:00:00Z");
    const result = computeDueToday(habits, logs, "UTC", wednesday);
    expect(result).toHaveLength(0);
  });

  it("shows habits due on fixed weekdays", () => {
    const habits: HabitInput[] = [
      habit({
        id: "1",
        name: "Weekend run",
        frequency: { type: "fixed_weekdays", days: [0, 6] },
      }),
    ];
    const logs: HabitLogInput[] = [];
    const saturday = new Date("2026-07-18T12:00:00Z");
    const result = computeDueToday(habits, logs, "UTC", saturday);
    expect(result).toHaveLength(1);
    expect(result[0].done).toBe(false);
  });

  it("times_per_week: shows due when weekly quota not met", () => {
    const habits: HabitInput[] = [
      habit({
        id: "1",
        name: "Gym",
        frequency: { type: "times_per_week", times: 3 },
      }),
    ];
    const monday = new Date("2026-07-13T12:00:00Z");
    const result = computeDueToday(habits, [], "UTC", monday);
    expect(result).toHaveLength(1);
    expect(result[0].done).toBe(false);
  });

  it("times_per_week: hides when weekly quota met", () => {
    const habits: HabitInput[] = [
      habit({
        id: "1",
        name: "Gym",
        frequency: { type: "times_per_week", times: 2 },
      }),
    ];
    const logs: HabitLogInput[] = [
      log("1", "2026-07-13"),
      log("1", "2026-07-14"),
    ];
    const friday = new Date("2026-07-17T12:00:00Z");
    const result = computeDueToday(habits, logs, "UTC", friday);
    expect(result).toHaveLength(0);
  });

  it("times_per_week: shows again in new week", () => {
    const habits: HabitInput[] = [
      habit({
        id: "1",
        name: "Gym",
        frequency: { type: "times_per_week", times: 2 },
      }),
    ];
    const logs: HabitLogInput[] = [
      log("1", "2026-07-13"),
      log("1", "2026-07-14"),
    ];
    const nextMonday = new Date("2026-07-20T12:00:00Z");
    const result = computeDueToday(habits, logs, "UTC", nextMonday);
    expect(result).toHaveLength(1);
    expect(result[0].done).toBe(false);
  });

  it("fixed_weekdays: gap between due days hides habit on off-days", () => {
    const habits: HabitInput[] = [
      habit({
        id: "1",
        name: "Gym",
        frequency: { type: "fixed_weekdays", days: [1, 3, 5] },
      }),
    ];
    const logs: HabitLogInput[] = [];
    const tuesday = new Date("2026-07-14T12:00:00Z");
    const result = computeDueToday(habits, logs, "UTC", tuesday);
    expect(result).toHaveLength(0);
  });
});

describe("computeStreak", () => {
  const HABIT_ID = "habit-1";

  function h(overrides?: Partial<HabitInput>): HabitInput {
    return habit({ id: HABIT_ID, name: "Test", ...overrides });
  }

  it("returns 0 when there are no logs", () => {
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeStreak(h(), [], "UTC", now)).toBe(0);
  });

  it("returns 0 when today has no log", () => {
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-16"),
      log(HABIT_ID, "2026-07-17"),
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeStreak(h(), logs, "UTC", now)).toBe(0);
  });

  it("streak continuation across consecutive days", () => {
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-15"),
      log(HABIT_ID, "2026-07-16"),
      log(HABIT_ID, "2026-07-17"),
    ];
    const now = new Date("2026-07-17T12:00:00Z");
    expect(computeStreak(h(), logs, "UTC", now)).toBe(3);
  });

  it("streak broken by a missed day", () => {
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-15"),
      log(HABIT_ID, "2026-07-17"),
    ];
    const now = new Date("2026-07-17T12:00:00Z");
    expect(computeStreak(h(), logs, "UTC", now)).toBe(1);
  });

  it("timezone boundary: log at 23:59 local vs 00:01 local", () => {
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-17"),
      log(HABIT_ID, "2026-07-18"),
    ];

    const beforeMidnight = new Date("2026-07-17T23:59:00-04:00");
    const afterMidnight = new Date("2026-07-18T00:01:00-04:00");

    expect(computeStreak(h(), logs, TZ_NY, beforeMidnight)).toBe(1);
    expect(computeStreak(h(), logs, TZ_NY, afterMidnight)).toBe(2);
  });

  it("streak with logs in Asia/Tokyo timezone", () => {
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-17"),
      log(HABIT_ID, "2026-07-18"),
    ];
    const now = new Date("2026-07-18T12:00:00+09:00");
    expect(computeStreak(h(), logs, TZ_TOKYO, now)).toBe(2);
  });

  it("handles logs from other habits without cross-contamination", () => {
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-17"),
      log(HABIT_ID, "2026-07-18"),
      log("other-habit", "2026-07-16"),
      log("other-habit", "2026-07-17"),
      log("other-habit", "2026-07-18"),
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeStreak(h(), logs, "UTC", now)).toBe(2);
  });

  it("returns 1 for single log on today", () => {
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-18"),
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeStreak(h(), logs, "UTC", now)).toBe(1);
  });

  it("non-due day does not break streak (fixed weekdays)", () => {
    const gym = h({
      frequency: { type: "fixed_weekdays", days: [1, 3, 5] },
    });
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-13"),
      log(HABIT_ID, "2026-07-15"),
      log(HABIT_ID, "2026-07-17"),
    ];
    const saturday = new Date("2026-07-18T12:00:00Z");
    expect(computeStreak(gym, logs, "UTC", saturday)).toBe(3);
  });

  it("non-due day does not break streak (fixed weekdays, gap in middle)", () => {
    const gym = h({
      frequency: { type: "fixed_weekdays", days: [1, 5] },
    });
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-13"),
      log(HABIT_ID, "2026-07-17"),
    ];
    const saturday = new Date("2026-07-18T12:00:00Z");
    expect(computeStreak(gym, logs, "UTC", saturday)).toBe(2);
  });

  it("returns 0 when today is due but not logged", () => {
    const gym = h({
      frequency: { type: "fixed_weekdays", days: [5] },
    });
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-10"),
    ];
    const friday = new Date("2026-07-17T12:00:00Z");
    expect(computeStreak(gym, logs, "UTC", friday)).toBe(0);
  });

  it("returns 0 when today is a non-due day but not logged (no logs at all)", () => {
    const gym = h({
      frequency: { type: "fixed_weekdays", days: [5] },
    });
    const saturday = new Date("2026-07-18T12:00:00Z");
    expect(computeStreak(gym, [], "UTC", saturday)).toBe(0);
  });

  it("times_per_week: streak survives on non-due day when quota met", () => {
    const gym = h({
      frequency: { type: "times_per_week", times: 2 },
    });
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-13"),
      log(HABIT_ID, "2026-07-14"),
    ];
    const saturday = new Date("2026-07-18T12:00:00Z");
    expect(computeStreak(gym, logs, "UTC", saturday)).toBe(2);
  });

  it("times_per_week: streak breaks when quota not met on due Friday", () => {
    const gym = h({
      frequency: { type: "times_per_week", times: 3 },
    });
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-13"),
      log(HABIT_ID, "2026-07-14"),
    ];
    const friday = new Date("2026-07-17T12:00:00Z");
    expect(computeStreak(gym, logs, "UTC", friday)).toBe(0);
  });
});

describe("quantifiable habits", () => {
  const HABIT_ID = "h1";

  function h(overrides?: Partial<HabitInput>): HabitInput {
    return habit({
      id: HABIT_ID,
      name: "Water",
      target: 2,
      unit: "L",
      ...overrides,
    });
  }

  it("isCompleteOnDate false when no logs", () => {
    const water = h();
    expect(isCompleteOnDate(water, "2026-07-18", [])).toBe(false);
  });

  it("isCompleteOnDate false when below target", () => {
    const water = h();
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-18", amount: 1 },
    ];
    expect(isCompleteOnDate(water, "2026-07-18", logs)).toBe(false);
  });

  it("isCompleteOnDate true when exactly at target", () => {
    const water = h();
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-18", amount: 2 },
    ];
    expect(isCompleteOnDate(water, "2026-07-18", logs)).toBe(true);
  });

  it("isCompleteOnDate true when above target", () => {
    const water = h();
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-18", amount: 3 },
    ];
    expect(isCompleteOnDate(water, "2026-07-18", logs)).toBe(true);
  });

  it("isCompleteOnDate sums multiple partial logs", () => {
    const water = h();
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-18", amount: 0.5 },
      { habitId: HABIT_ID, logDate: "2026-07-18", amount: 1.0 },
    ];
    expect(isCompleteOnDate(water, "2026-07-18", logs)).toBe(false);
  });

  it("isCompleteOnDate true when multiple partial logs reach target", () => {
    const water = h();
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-18", amount: 0.5 },
      { habitId: HABIT_ID, logDate: "2026-07-18", amount: 1.5 },
    ];
    expect(isCompleteOnDate(water, "2026-07-18", logs)).toBe(true);
  });

  it("computeProgress returns current sum", () => {
    const water = h();
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-18", amount: 0.5 },
      { habitId: HABIT_ID, logDate: "2026-07-18", amount: 0.7 },
    ];
    const progress = computeProgress(water, "2026-07-18", logs);
    expect(progress.current).toBe(1.2);
    expect(progress.target).toBe(2);
    expect(progress.unit).toBe("L");
  });

  it("streak honors quantifiable completion threshold", () => {
    const water = h();
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-16", amount: 2 },
      { habitId: HABIT_ID, logDate: "2026-07-17", amount: 2 },
      { habitId: HABIT_ID, logDate: "2026-07-18", amount: 2 },
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeStreak(water, logs, "UTC", now)).toBe(3);
  });

  it("streak breaks when quantifiable target not met on due day", () => {
    const water = h();
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-16", amount: 2 },
      { habitId: HABIT_ID, logDate: "2026-07-17", amount: 1 },
      { habitId: HABIT_ID, logDate: "2026-07-18", amount: 2 },
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeStreak(water, logs, "UTC", now)).toBe(1);
  });

  it("streak: one below target does not complete the day", () => {
    const water = h();
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-18", amount: 1 },
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeStreak(water, logs, "UTC", now)).toBe(0);
  });
});
