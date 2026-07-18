export interface HabitResponse {
  id: string;
  name: string;
  description: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLogResponse {
  id: string;
  habitId: string;
  logDate: string;
  createdAt: string;
}
