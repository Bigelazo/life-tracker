export interface HabitInput {
  id: string;
  name: string;
  description: string | null;
  archived: boolean;
}

export interface HabitLogInput {
  habitId: string;
  logDate: string;
}

function formatDate(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
  return formatter.format(date);
}

export function todayDateString(timezone: string, now?: Date): string {
  return formatDate(now ?? new Date(), timezone);
}

export function computeDueToday(
  habits: HabitInput[],
  logs: HabitLogInput[],
  timezone: string,
  now?: Date,
): Array<{ habit: HabitInput; done: boolean }> {
  const today = formatDate(now ?? new Date(), timezone);
  const todayLogs = new Set(
    logs.filter((l) => l.logDate === today).map((l) => l.habitId),
  );
  return habits
    .filter((h) => !h.archived)
    .map((h) => ({ habit: h, done: todayLogs.has(h.id) }));
}

export function computeStreak(
  habitId: string,
  logs: HabitLogInput[],
  timezone: string,
  now?: Date,
): number {
  const logDates = new Set(
    logs.filter((l) => l.habitId === habitId).map((l) => l.logDate),
  );
  if (logDates.size === 0) return 0;

  const today = formatDate(now ?? new Date(), timezone);
  if (!logDates.has(today)) return 0;

  let streak = 0;
  let cursor = now ?? new Date();
  while (true) {
    const dateStr = formatDate(cursor, timezone);
    if (!logDates.has(dateStr)) break;
    streak++;
    if (streak > 10_000) break;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }

  return streak;
}
