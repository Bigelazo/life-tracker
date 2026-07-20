import type { Habit, HabitLog, HabitRelapse } from "@/db/schema";
import type { HabitFrequency, HabitType } from "./domain";
import type { HabitLogResponse, HabitResponse, RelapseResponse } from "./api-types";

export function serializeHabit(row: Habit): HabitResponse {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    archived: row.archived,
    habitType: row.habitType as HabitType,
    frequency: row.frequency as HabitFrequency,
    target: row.target,
    unit: row.unit,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeHabitLog(row: HabitLog): HabitLogResponse {
  return {
    id: row.id,
    habitId: row.habitId,
    logDate: row.logDate,
    amount: row.amount,
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeRelapse(row: HabitRelapse): RelapseResponse {
  return {
    id: row.id,
    habitId: row.habitId,
    relapsedAt: row.relapsedAt.toISOString(),
  };
}