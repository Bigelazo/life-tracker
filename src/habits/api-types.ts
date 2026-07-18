import type { HabitFrequency } from "./domain";

export interface HabitResponse {
  id: string;
  name: string;
  description: string | null;
  archived: boolean;
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
