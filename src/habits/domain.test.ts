import { describe, expect, it } from "vitest";
import {
  computeDueToday,
  computeStreak,
  todayDateString,
} from "./domain";
import type { HabitInput, HabitLogInput } from "./domain";

function habit(
  overrides: Partial<HabitInput> & { id: string; name: string },
): HabitInput {
  return {
    description: null,
    archived: false,
    ...overrides,
  };
}

const TZ_NY = "America/New_York";
const TZ_TOKYO = "Asia/Tokyo";

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
      { habitId: "1", logDate: "2026-07-18" },
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
      { habitId: "1", logDate: "2026-07-17" },
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
});

describe("computeStreak", () => {
  const HABIT_ID = "habit-1";

  it("returns 0 when there are no logs", () => {
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeStreak(HABIT_ID, [], "UTC", now)).toBe(0);
  });

  it("returns 0 when today has no log", () => {
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-16" },
      { habitId: HABIT_ID, logDate: "2026-07-17" },
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeStreak(HABIT_ID, logs, "UTC", now)).toBe(0);
  });

  it("streak continuation across consecutive days", () => {
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-15" },
      { habitId: HABIT_ID, logDate: "2026-07-16" },
      { habitId: HABIT_ID, logDate: "2026-07-17" },
    ];
    const now = new Date("2026-07-17T12:00:00Z");
    expect(computeStreak(HABIT_ID, logs, "UTC", now)).toBe(3);
  });

  it("streak broken by a missed day", () => {
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-15" },
      { habitId: HABIT_ID, logDate: "2026-07-17" },
    ];
    const now = new Date("2026-07-17T12:00:00Z");
    expect(computeStreak(HABIT_ID, logs, "UTC", now)).toBe(1);
  });

  it("timezone boundary: log at 23:59 local vs 00:01 local", () => {
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-17" },
      { habitId: HABIT_ID, logDate: "2026-07-18" },
    ];

    const beforeMidnight = new Date("2026-07-17T23:59:00-04:00");
    const afterMidnight = new Date("2026-07-18T00:01:00-04:00");

    expect(computeStreak(HABIT_ID, logs, TZ_NY, beforeMidnight)).toBe(1);
    expect(computeStreak(HABIT_ID, logs, TZ_NY, afterMidnight)).toBe(2);
  });

  it("streak with logs in Asia/Tokyo timezone", () => {
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-17" },
      { habitId: HABIT_ID, logDate: "2026-07-18" },
    ];
    const now = new Date("2026-07-18T12:00:00+09:00");
    expect(computeStreak(HABIT_ID, logs, TZ_TOKYO, now)).toBe(2);
  });

  it("handles logs from other habits without cross-contamination", () => {
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-17" },
      { habitId: HABIT_ID, logDate: "2026-07-18" },
      { habitId: "other-habit", logDate: "2026-07-16" },
      { habitId: "other-habit", logDate: "2026-07-17" },
      { habitId: "other-habit", logDate: "2026-07-18" },
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeStreak(HABIT_ID, logs, "UTC", now)).toBe(2);
  });

  it("returns 1 for single log on today", () => {
    const logs: HabitLogInput[] = [
      { habitId: HABIT_ID, logDate: "2026-07-18" },
    ];
    const now = new Date("2026-07-18T12:00:00Z");
    expect(computeStreak(HABIT_ID, logs, "UTC", now)).toBe(1);
  });
});
