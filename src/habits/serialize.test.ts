import { describe, expect, it } from "vitest";
import type { Habit, HabitLog, HabitRelapse } from "@/db/schema";
import {
  serializeHabit,
  serializeHabitLog,
  serializeRelapse,
} from "./serialize";

const fixedDate = new Date("2026-07-18T12:00:00Z");

function habitRow(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    name: "Walk",
    description: null,
    archived: false,
    habitType: "positive",
    frequency: { type: "daily" },
    target: null,
    unit: null,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    ...overrides,
  };
}

function logRow(overrides: Partial<HabitLog> = {}): HabitLog {
  return {
    id: "l1",
    habitId: "h1",
    logDate: "2026-07-18",
    amount: 1,
    createdAt: fixedDate,
    ...overrides,
  };
}

function relapseRow(overrides: Partial<HabitRelapse> = {}): HabitRelapse {
  return {
    id: "r1",
    habitId: "h1",
    relapsedAt: fixedDate,
    ...overrides,
  };
}

describe("serializeHabit", () => {
  it("serializes a full habit row with ISO timestamps", () => {
    expect(serializeHabit(habitRow())).toEqual({
      id: "h1",
      name: "Walk",
      description: null,
      archived: false,
      habitType: "positive",
      frequency: { type: "daily" },
      target: null,
      unit: null,
      createdAt: "2026-07-18T12:00:00.000Z",
      updatedAt: "2026-07-18T12:00:00.000Z",
    });
  });

  it("preserves quantifiable + non-default frequency fields", () => {
    expect(
      serializeHabit(
        habitRow({
          habitType: "negative",
          frequency: { type: "times_per_week", times: 3 },
          target: 2.5,
          unit: "L",
          description: "Soda",
        }),
      ),
    ).toMatchObject({
      habitType: "negative",
      frequency: { type: "times_per_week", times: 3 },
      target: 2.5,
      unit: "L",
      description: "Soda",
    });
  });
});

describe("serializeHabitLog", () => {
  it("serializes a log row with ISO createdAt", () => {
    expect(serializeHabitLog(logRow({ amount: 2 }))).toEqual({
      id: "l1",
      habitId: "h1",
      logDate: "2026-07-18",
      amount: 2,
      createdAt: "2026-07-18T12:00:00.000Z",
    });
  });
});

describe("serializeRelapse", () => {
  it("serializes a relapse row with ISO relapsedAt", () => {
    expect(serializeRelapse(relapseRow())).toEqual({
      id: "r1",
      habitId: "h1",
      relapsedAt: "2026-07-18T12:00:00.000Z",
    });
  });
});