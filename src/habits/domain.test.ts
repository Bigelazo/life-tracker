import { describe, expect, it } from "vitest";
import {
  buildLogIndex,
  computeBestStreak,
  computeCompletionRate,
  computeDueToday,
  computeElapsedSince,
  computeProgress,
  computeStreak,
  computeYearHeatmap,
  formatElapsed,
  isCompleteOnDate,
  isDueOnDate,
  isoDateNDaysAgo,
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

describe("isoDateNDaysAgo", () => {
  it("returns the ISO date N days before the given now", () => {
    const now = new Date("2026-07-18T12:00:00Z");
    expect(isoDateNDaysAgo(0, now)).toBe("2026-07-18");
    expect(isoDateNDaysAgo(1, now)).toBe("2026-07-17");
    expect(isoDateNDaysAgo(7, now)).toBe("2026-07-11");
  });

  it("crosses month and year boundaries", () => {
    const now = new Date("2026-01-03T12:00:00Z");
    expect(isoDateNDaysAgo(5, now)).toBe("2025-12-29");
  });

  it("pads single-digit months and days", () => {
    const now = new Date("2026-03-05T12:00:00Z");
    expect(isoDateNDaysAgo(1, now)).toBe("2026-03-04");
    expect(isoDateNDaysAgo(31, now)).toBe("2026-02-02");
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

describe("computeBestStreak", () => {
  const HABIT_ID = "h";

  function h(overrides?: Partial<HabitInput>): HabitInput {
    return habit({
      id: HABIT_ID,
      name: "Test",
      createdAt: "2026-01-01T00:00:00Z",
      ...overrides,
    });
  }

  it("returns 0 when there are no logs", () => {
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeBestStreak(h(), [], "UTC", now)).toBe(0);
  });

  it("returns 1 for a single log", () => {
    const logs: HabitLogInput[] = [log(HABIT_ID, "2026-07-10")];
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeBestStreak(h(), logs, "UTC", now)).toBe(1);
  });

  it("returns 3 for a 3-day run", () => {
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-10"),
      log(HABIT_ID, "2026-07-11"),
      log(HABIT_ID, "2026-07-12"),
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeBestStreak(h(), logs, "UTC", now)).toBe(3);
  });

  it("picks the longest run among multiple", () => {
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-01"),
      log(HABIT_ID, "2026-07-02"),
      log(HABIT_ID, "2026-07-04"),
      log(HABIT_ID, "2026-07-05"),
      log(HABIT_ID, "2026-07-06"),
      log(HABIT_ID, "2026-07-07"),
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeBestStreak(h(), logs, "UTC", now)).toBe(4);
  });

  it("does not break on non-due days (fixed weekdays)", () => {
    const gym = h({
      frequency: { type: "fixed_weekdays", days: [1, 3, 5] },
    });
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-13"),
      log(HABIT_ID, "2026-07-15"),
      log(HABIT_ID, "2026-07-17"),
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeBestStreak(gym, logs, "UTC", now)).toBe(3);
  });

  it("counts non-due days as transparent for fixed weekdays across longer spans", () => {
    const gym = h({
      frequency: { type: "fixed_weekdays", days: [1, 5] },
    });
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-06-01"),
      log(HABIT_ID, "2026-06-05"),
      log(HABIT_ID, "2026-06-08"),
      log(HABIT_ID, "2026-06-12"),
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeBestStreak(gym, logs, "UTC", now)).toBe(4);
  });

  it("returns 0 for negative habits", () => {
    const neg = habit({
      id: HABIT_ID,
      name: "Neg",
      habitType: "negative",
    });
    const logs: HabitLogInput[] = [log(HABIT_ID, "2026-07-10")];
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeBestStreak(neg, logs, "UTC", now)).toBe(0);
  });

  it("honors quantifiable completion threshold", () => {
    const water = h({ target: 2, unit: "L" });
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-10", amount: 2 },
      { habitId: HABIT_ID, logDate: "2026-07-11", amount: 1 },
      { habitId: HABIT_ID, logDate: "2026-07-12", amount: 2 },
      { habitId: HABIT_ID, logDate: "2026-07-13", amount: 2 },
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeBestStreak(water, logs, "UTC", now)).toBe(2);
  });

  it("ignores logs from other habits", () => {
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-10"),
      log(HABIT_ID, "2026-07-11"),
      log(HABIT_ID, "2026-07-12"),
      log("other-habit", "2026-07-10"),
      log("other-habit", "2026-07-11"),
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeBestStreak(h(), logs, "UTC", now)).toBe(3);
  });
});

describe("computeCompletionRate", () => {
  const HABIT_ID = "h";

  function h(overrides?: Partial<HabitInput>): HabitInput {
    return habit({
      id: HABIT_ID,
      name: "Test",
      createdAt: "2026-01-01T00:00:00Z",
      ...overrides,
    });
  }

  it("returns zeros when range ends before habit was created", () => {
    const later = h({ createdAt: "2026-12-01T00:00:00Z" });
    const now = new Date("2026-07-18T12:00:00Z");
    const result = computeCompletionRate(
      later,
      [],
      "2026-07-01",
      "2026-07-18",
      "UTC",
      now,
    );
    expect(result).toEqual({ completed: 0, due: 0, rate: 0 });
  });

  it("100% when every due day is complete (daily)", () => {
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-10"),
      log(HABIT_ID, "2026-07-11"),
      log(HABIT_ID, "2026-07-12"),
    ];
    const now = new Date("2026-07-12T12:00:00Z");
    const result = computeCompletionRate(
      h(),
      logs,
      "2026-07-10",
      "2026-07-12",
      "UTC",
      now,
    );
    expect(result.completed).toBe(3);
    expect(result.due).toBe(3);
    expect(result.rate).toBe(1);
  });

  it("50% when half of due days are complete (daily)", () => {
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-10"),
      log(HABIT_ID, "2026-07-12"),
    ];
    const now = new Date("2026-07-13T12:00:00Z");
    const result = computeCompletionRate(
      h(),
      logs,
      "2026-07-10",
      "2026-07-13",
      "UTC",
      now,
    );
    expect(result.completed).toBe(2);
    expect(result.due).toBe(4);
    expect(result.rate).toBe(0.5);
  });

  it("ignores non-due days (fixed weekdays)", () => {
    const gym = h({
      frequency: { type: "fixed_weekdays", days: [1, 3, 5] },
    });
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-13"),
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    const result = computeCompletionRate(
      gym,
      logs,
      "2026-07-13",
      "2026-07-17",
      "UTC",
      now,
    );
    expect(result.completed).toBe(1);
    expect(result.due).toBe(3);
    expect(result.rate).toBeCloseTo(1 / 3, 5);
  });

  it("ignores days before creation", () => {
    const later = h({ createdAt: "2026-07-15T00:00:00Z" });
    const logs: HabitLogInput[] = [log(HABIT_ID, "2026-07-15")];
    const now = new Date("2026-07-18T12:00:00Z");
    const result = computeCompletionRate(
      later,
      logs,
      "2026-07-10",
      "2026-07-18",
      "UTC",
      now,
    );
    expect(result.completed).toBe(1);
    expect(result.due).toBe(4);
    expect(result.rate).toBe(0.25);
  });

  it("ignores future days", () => {
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-10"),
      log(HABIT_ID, "2026-07-11"),
    ];
    const now = new Date("2026-07-11T12:00:00Z");
    const result = computeCompletionRate(
      h(),
      logs,
      "2026-07-10",
      "2026-07-20",
      "UTC",
      now,
    );
    expect(result.completed).toBe(2);
    expect(result.due).toBe(2);
    expect(result.rate).toBe(1);
  });

  it("quantifiable: counts a day only when amount >= target", () => {
    const water = h({ target: 2, unit: "L" });
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-10", amount: 1 },
      { habitId: HABIT_ID, logDate: "2026-07-11", amount: 2 },
      { habitId: HABIT_ID, logDate: "2026-07-12", amount: 3 },
    ];
    const now = new Date("2026-07-12T12:00:00Z");
    const result = computeCompletionRate(
      water,
      logs,
      "2026-07-10",
      "2026-07-12",
      "UTC",
      now,
    );
    expect(result.completed).toBe(2);
    expect(result.due).toBe(3);
    expect(result.rate).toBeCloseTo(2 / 3, 5);
  });

  it("ignores logs from other habits", () => {
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-10"),
      log("other-habit", "2026-07-11"),
      log("other-habit", "2026-07-12"),
    ];
    const now = new Date("2026-07-12T12:00:00Z");
    const result = computeCompletionRate(
      h(),
      logs,
      "2026-07-10",
      "2026-07-12",
      "UTC",
      now,
    );
    expect(result.completed).toBe(1);
    expect(result.due).toBe(3);
    expect(result.rate).toBeCloseTo(1 / 3, 5);
  });

  it("returns 0 rate for negative habits (semantics don't apply)", () => {
    const neg = habit({
      id: HABIT_ID,
      name: "Neg",
      habitType: "negative",
    });
    const now = new Date("2026-07-12T12:00:00Z");
    const result = computeCompletionRate(
      neg,
      [],
      "2026-07-10",
      "2026-07-12",
      "UTC",
      now,
    );
    expect(result).toEqual({ completed: 0, due: 0, rate: 0 });
  });
});

describe("computeYearHeatmap", () => {
  const HABIT_ID = "h";

  function h(overrides?: Partial<HabitInput>): HabitInput {
    return habit({
      id: HABIT_ID,
      name: "Test",
      createdAt: "2026-01-01T00:00:00Z",
      ...overrides,
    });
  }

  it("returns one entry per day in the year", () => {
    const now = new Date("2026-07-18T12:00:00Z");
    const days = computeYearHeatmap(h(), [], [], 2026, "UTC", now);
    expect(days).toHaveLength(365);
    expect(days[0]?.date).toBe("2026-01-01");
    expect(days[364]?.date).toBe("2026-12-31");
  });

  it("daily: marks complete days as done, others as missed, before-creation dates", () => {
    const older = h({ createdAt: "2026-06-01T00:00:00Z" });
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-06-01"),
      log(HABIT_ID, "2026-06-03"),
    ];
    const now = new Date("2026-06-05T12:00:00Z");
    const days = computeYearHeatmap(older, logs, [], 2026, "UTC", now);
    const map = new Map(days.map((d) => [d.date, d.status]));
    expect(map.get("2026-01-15")).toBe("before-creation");
    expect(map.get("2026-06-01")).toBe("done");
    expect(map.get("2026-06-02")).toBe("missed");
    expect(map.get("2026-06-03")).toBe("done");
    expect(map.get("2026-06-04")).toBe("missed");
  });

  it("fixed weekdays: marks off-days as not-due", () => {
    const gym = h({
      frequency: { type: "fixed_weekdays", days: [1, 3, 5] },
    });
    const logs: HabitLogInput[] = [log(HABIT_ID, "2026-07-13")];
    const now = new Date("2026-07-18T12:00:00Z");
    const days = computeYearHeatmap(gym, logs, [], 2026, "UTC", now);
    const map = new Map(days.map((d) => [d.date, d.status]));
    expect(map.get("2026-07-13")).toBe("done");
    expect(map.get("2026-07-14")).toBe("not-due");
    expect(map.get("2026-07-15")).toBe("missed");
    expect(map.get("2026-07-16")).toBe("not-due");
    expect(map.get("2026-07-17")).toBe("missed");
  });

  it("quantifiable: target hit = done; below target = missed", () => {
    const water = h({
      target: 2,
      unit: "L",
      createdAt: "2026-06-01T00:00:00Z",
    });
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-13", amount: 2 },
      { habitId: HABIT_ID, logDate: "2026-07-14", amount: 1 },
    ];
    const now = new Date("2026-07-15T12:00:00Z");
    const days = computeYearHeatmap(water, logs, [], 2026, "UTC", now);
    const map = new Map(days.map((d) => [d.date, d.status]));
    expect(map.get("2026-07-13")).toBe("done");
    expect(map.get("2026-07-14")).toBe("missed");
  });

  it("negative habit: relapse day = relapse, others = done, before creation = before-creation", () => {
    const neg = habit({
      id: HABIT_ID,
      name: "Caffeine",
      habitType: "negative",
      createdAt: "2026-05-01T00:00:00Z",
    });
    const relapses: RelapseInput[] = [
      { id: "r1", habitId: HABIT_ID, relapsedAt: "2026-07-15T08:00:00Z" },
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    const days = computeYearHeatmap(neg, [], relapses, 2026, "UTC", now);
    const map = new Map(days.map((d) => [d.date, d.status]));
    expect(map.get("2026-04-15")).toBe("before-creation");
    expect(map.get("2026-05-01")).toBe("done");
    expect(map.get("2026-07-15")).toBe("relapse");
    expect(map.get("2026-07-16")).toBe("done");
  });

  it("handles a 366-day leap year", () => {
    const now = new Date("2024-06-15T12:00:00Z");
    const days = computeYearHeatmap(h(), [], [], 2024, "UTC", now);
    expect(days).toHaveLength(366);
    expect(days[365]?.date).toBe("2024-12-31");
  });

  it("future days (past today) for daily are not-due", () => {
    const now = new Date("2026-07-18T12:00:00Z");
    const days = computeYearHeatmap(h(), [], [], 2026, "UTC", now);
    const map = new Map(days.map((d) => [d.date, d.status]));
    expect(map.get("2026-07-17")).toBe("missed");
    expect(map.get("2026-07-18")).toBe("missed");
    expect(map.get("2026-07-19")).toBe("not-due");
    expect(map.get("2026-12-31")).toBe("not-due");
  });

  it("timezone boundary: log just before midnight is in the previous day", () => {
    const logs: HabitLogInput[] = [log(HABIT_ID, "2026-07-17")];
    const justAfterMidnight = new Date("2026-07-18T00:01:00-04:00");
    const days = computeYearHeatmap(h(), logs, [], 2026, TZ_NY, justAfterMidnight);
    const map = new Map(days.map((d) => [d.date, d.status]));
    expect(map.get("2026-07-17")).toBe("done");
    expect(map.get("2026-07-18")).toBe("missed");
  });

  it("accepts a prebuilt index and matches the array-based result", () => {
    const logs: HabitLogInput[] = [
      log(HABIT_ID, "2026-07-13"),
      log(HABIT_ID, "2026-07-15"),
      log(HABIT_ID, "2026-07-17"),
    ];
    const gym = h({ frequency: { type: "fixed_weekdays", days: [1, 3, 5] } });
    const now = new Date("2026-07-18T12:00:00Z");
    const fromArray = computeYearHeatmap(gym, logs, [], 2026, "UTC", now);
    const fromIndex = computeYearHeatmap(gym, buildLogIndex(logs), [], 2026, "UTC", now);
    expect(fromIndex).toEqual(fromArray);
  });
});

describe("buildLogIndex", () => {
  it("produces identical results to passing the raw array, for every consumer", () => {
    const gym = habit({
      id: "gym",
      name: "Gym",
      frequency: { type: "fixed_weekdays", days: [1, 3, 5] },
    });
    const water = habit({
      id: "water",
      name: "Water",
      target: 2,
      unit: "L",
    });
    const logs: HabitLogInput[] = [
      log("gym", "2026-07-13"),
      log("gym", "2026-07-15"),
      log("gym", "2026-07-17"),
      { habitId: "water", logDate: "2026-07-17", amount: 1 },
      { habitId: "water", logDate: "2026-07-17", amount: 0.5 },
      { habitId: "water", logDate: "2026-07-18", amount: 0.6 },
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    const index = buildLogIndex(logs);

    expect(computeStreak(gym, index, "UTC", now)).toBe(
      computeStreak(gym, logs, "UTC", now),
    );
    expect(computeBestStreak(gym, index, "UTC", now)).toBe(
      computeBestStreak(gym, logs, "UTC", now),
    );
    expect(
      computeCompletionRate(gym, index, "2026-01-01", "2026-12-31", "UTC", now),
    ).toEqual(
      computeCompletionRate(gym, logs, "2026-01-01", "2026-12-31", "UTC", now),
    );
    expect(isCompleteOnDate(water, "2026-07-17", index)).toBe(
      isCompleteOnDate(water, "2026-07-17", logs),
    );
    expect(isCompleteOnDate(water, "2026-07-18", index)).toBe(
      isCompleteOnDate(water, "2026-07-18", logs),
    );
    expect(computeProgress(water, "2026-07-17", index)).toEqual(
      computeProgress(water, "2026-07-17", logs),
    );
  });
});
