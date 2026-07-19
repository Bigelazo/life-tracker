import type { HabitFrequency, HabitType } from "./domain";

export interface HabitResponse {
  id: string;
  name: string;
  description: string | null;
  archived: boolean;
  habitType: HabitType;
  frequency: HabitFrequency;
  target: number | null;
  unit: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLogResponse {
  id: string;
  habitId: string;
  logDate: string;
  amount: number;
  createdAt: string;
}

export interface RelapseResponse {
  id: string;
  habitId: string;
  relapsedAt: string;
}
