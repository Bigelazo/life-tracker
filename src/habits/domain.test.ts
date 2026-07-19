import { describe, expect, it } from "vitest";
import {
  computeDueToday,
  computeElapsedSince,
  computeProgress,
  computeStreak,
  formatElapsed,
  isCompleteOnDate,
  isDueOnDate,
  todayDateString,
} from "./domain";
import type { HabitInput, HabitLogInput, RelapseInput } from "./domain";

function habit(
  overrides: Partial<HabitInput> & { id: string; name: string },
): HabitInput {
  return {
    description: null,
    archived: false,
    habitType: "positive",
    frequency: { type: "daily" },
    target: null,
    unit: null,
    createdAt: "2026-07-18T00:00:00Z",
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

describe("negative habits", () => {
  const NEG_ID = "neg-1";

  function nh(overrides?: Partial<HabitInput>): HabitInput {
    return habit({
      id: NEG_ID,
      name: "No caffeine",
      habitType: "negative",
      ...overrides,
    });
  }

  function relapse(
    overrides: Partial<RelapseInput> & { id: string },
  ): RelapseInput {
    return {
      habitId: NEG_ID,
      relapsedAt: "2026-07-18T08:00:00Z",
      ...overrides,
    };
  }

  it("isDueOnDate returns true for active negative habits", () => {
    const neg = nh();
    expect(isDueOnDate(neg, "2026-07-18", [])).toBe(true);
  });

  it("isDueOnDate returns false for archived negative habits", () => {
    const neg = nh({ archived: true });
    expect(isDueOnDate(neg, "2026-07-18", [])).toBe(false);
  });

  it("isCompleteOnDate always returns false for negative habits", () => {
    const neg = nh();
    expect(isCompleteOnDate(neg, "2026-07-18", [])).toBe(false);
  });

  it("computeDueToday includes negative habits", () => {
    const habits: HabitInput[] = [nh()];
    const now = new Date("2026-07-18T12:00:00Z");
    const result = computeDueToday(habits, [], "UTC", now);
    expect(result).toHaveLength(1);
    expect(result[0].habit.id).toBe(NEG_ID);
    expect(result[0].done).toBe(false);
  });

  it("computeDueToday excludes archived negative habits", () => {
    const habits: HabitInput[] = [nh({ archived: true })];
    const now = new Date("2026-07-18T12:00:00Z");
    const result = computeDueToday(habits, [], "UTC", now);
    expect(result).toHaveLength(0);
  });

  it("computeStreak returns 0 for negative habits", () => {
    const neg = nh();
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeStreak(neg, [], "UTC", now)).toBe(0);
  });

  describe("computeElapsedSince", () => {
    it("computes elapsed since creation when no relapses", () => {
      const neg = nh({ createdAt: "2026-07-17T10:00:00Z" });
      const now = new Date("2026-07-18T14:00:00Z");
      const elapsed = computeElapsedSince(neg, [], now);
      expect(elapsed).toEqual({ days: 1, hours: 4 });
    });

    it("computes elapsed since creation same-day", () => {
      const neg = nh({ createdAt: "2026-07-18T10:00:00Z" });
      const now = new Date("2026-07-18T14:00:00Z");
      const elapsed = computeElapsedSince(neg, [], now);
      expect(elapsed).toEqual({ days: 0, hours: 4 });
    });

    it("computes elapsed since latest relapse (first relapse)", () => {
      const neg = nh({ createdAt: "2026-07-15T10:00:00Z" });
      const relapses: RelapseInput[] = [
        relapse({ id: "r1", relapsedAt: "2026-07-17T12:00:00Z" }),
      ];
      const now = new Date("2026-07-18T14:00:00Z");
      const elapsed = computeElapsedSince(neg, relapses, now);
      expect(elapsed).toEqual({ days: 1, hours: 2 });
    });

    it("computes elapsed since latest relapse (consecutive relapses)", () => {
      const neg = nh({ createdAt: "2026-07-15T10:00:00Z" });
      const relapses: RelapseInput[] = [
        relapse({ id: "r1", relapsedAt: "2026-07-16T12:00:00Z" }),
        relapse({ id: "r2", relapsedAt: "2026-07-17T08:00:00Z" }),
        relapse({ id: "r3", relapsedAt: "2026-07-18T10:00:00Z" }),
      ];
      const now = new Date("2026-07-18T14:00:00Z");
      const elapsed = computeElapsedSince(neg, relapses, now);
      expect(elapsed).toEqual({ days: 0, hours: 4 });
    });

    it("resets counter immediately after relapse (same second)", () => {
      const neg = nh({ createdAt: "2026-07-15T10:00:00Z" });
      const relapses: RelapseInput[] = [
        relapse({ id: "r1", relapsedAt: "2026-07-18T14:00:00Z" }),
      ];
      const now = new Date("2026-07-18T14:00:00Z");
      const elapsed = computeElapsedSince(neg, relapses, now);
      expect(elapsed).toEqual({ days: 0, hours: 0 });
    });

    it("handles multiple relapses correctly (picks latest)", () => {
      const neg = nh({ createdAt: "2026-07-15T10:00:00Z" });
      const relapses: RelapseInput[] = [
        relapse({ id: "r1", relapsedAt: "2026-07-16T09:00:00Z" }),
        relapse({ id: "r2", relapsedAt: "2026-07-17T10:00:00Z" }),
        // r3 is earlier than r2 — should be ignored
        relapse({ id: "r3", relapsedAt: "2026-07-16T18:00:00Z" }),
      ];
      const now = new Date("2026-07-18T10:00:00Z");
      const elapsed = computeElapsedSince(neg, relapses, now);
      expect(elapsed).toEqual({ days: 1, hours: 0 });
    });

    it("crosses day boundaries correctly", () => {
      const neg = nh({ createdAt: "2026-07-17T22:00:00Z" });
      const now = new Date("2026-07-18T02:00:00Z");
      const elapsed = computeElapsedSince(neg, [], now);
      expect(elapsed).toEqual({ days: 0, hours: 4 });
    });
  });

  describe("formatElapsed", () => {
    it("formats days only", () => {
      expect(formatElapsed({ days: 3, hours: 0 })).toBe("3 days");
    });

    it("formats days and hours", () => {
      expect(formatElapsed({ days: 2, hours: 5 })).toBe("2 days 5 hr");
    });

    it("formats single day", () => {
      expect(formatElapsed({ days: 1, hours: 0 })).toBe("1 day");
    });

    it("formats single day with hours", () => {
      expect(formatElapsed({ days: 1, hours: 3 })).toBe("1 day 3 hr");
    });

    it("formats hours only", () => {
      expect(formatElapsed({ days: 0, hours: 6 })).toBe("6 hr");
    });

    it("formats single hour", () => {
      expect(formatElapsed({ days: 0, hours: 1 })).toBe("1 hr");
    });

    it("formats zero (just relapsed)", () => {
      expect(formatElapsed({ days: 0, hours: 0 })).toBe("now");
    });
  });

  describe("coerceHabitType", () => {
    it("defaults to positive for invalid input", async () => {
      const { coerceHabitType } = await import("./domain");
      expect(coerceHabitType(null)).toBe("positive");
      expect(coerceHabitType(undefined)).toBe("positive");
      expect(coerceHabitType("invalid")).toBe("positive");
      expect(coerceHabitType({})).toBe("positive");
    });

    it("returns negative for 'negative'", async () => {
      const { coerceHabitType } = await import("./domain");
      expect(coerceHabitType("negative")).toBe("negative");
    });

    it("returns positive for 'positive'", async () => {
      const { coerceHabitType } = await import("./domain");
      expect(coerceHabitType("positive")).toBe("positive");
    });
  });
});
