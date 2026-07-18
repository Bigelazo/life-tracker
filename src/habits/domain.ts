export type HabitFrequency =
  | { type: "daily" }
  | { type: "times_per_week"; times: number }
  | { type: "fixed_weekdays"; days: number[] };

export interface HabitInput {
  id: string;
  name: string;
  description: string | null;
  archived: boolean;
  frequency: HabitFrequency;
  target: number | null;
  unit: string | null;
}

export interface HabitLogInput {
  habitId: string;
  logDate: string;
  amount: number;
}

interface DateInfo {
  year: number;
  month: number;
  day: number;
  weekday: number;
  dateStr: string;
}

function formatDate(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
  return formatter.format(date);
}

function getDateInfo(dateStr: string): DateInfo {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return { year, month, day, weekday: d.getDay(), dateStr };
}

function getWeekStart(dateStr: string): string {
  const info = getDateInfo(dateStr);
  const d = new Date(info.year, info.month - 1, info.day);
  const dayOfWeek = d.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setDate(d.getDate() - diff);
  return formatDateLocal(d);
}

function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dateStr: string, n: number): string {
  const info = getDateInfo(dateStr);
  const d = new Date(info.year, info.month - 1, info.day + n);
  return formatDateLocal(d);
}

export function todayDateString(timezone: string, now?: Date): string {
  return formatDate(now ?? new Date(), timezone);
}

export function isDueOnDate(
  habit: HabitInput,
  dateStr: string,
  logs: HabitLogInput[],
): boolean {
  if (habit.archived) return false;

  const freq = habit.frequency;

  if (freq.type === "daily") return true;

  if (freq.type === "fixed_weekdays") {
    const info = getDateInfo(dateStr);
    return freq.days.includes(info.weekday);
  }

  if (freq.type === "times_per_week") {
    const weekStart = getWeekStart(dateStr);
    const weekEnd = addDays(weekStart, 6);
    const weekLogs = logs.filter(
      (l) =>
        l.habitId === habit.id &&
        l.logDate >= weekStart &&
        l.logDate <= weekEnd,
    );
    const completedDays = new Set(weekLogs.map((l) => l.logDate)).size;
    return completedDays < freq.times;
  }

  return true;
}

export function computeDueToday(
  habits: HabitInput[],
  logs: HabitLogInput[],
  timezone: string,
  now?: Date,
): Array<{ habit: HabitInput; done: boolean }> {
  const today = formatDate(now ?? new Date(), timezone);
  return habits
    .filter((h) => !h.archived && isDueOnDate(h, today, logs))
    .map((h) => ({
      habit: h,
      done: isCompleteOnDate(h, today, logs),
    }));
}

export function computeProgress(
  habit: HabitInput,
  dateStr: string,
  logs: HabitLogInput[],
): { current: number; target: number | null; unit: string | null } {
  const total = logs
    .filter((l) => l.habitId === habit.id && l.logDate === dateStr)
    .reduce((sum, l) => sum + l.amount, 0);
  return { current: total, target: habit.target, unit: habit.unit };
}

export function isCompleteOnDate(
  habit: HabitInput,
  dateStr: string,
  logs: HabitLogInput[],
): boolean {
  const dayLogs = logs.filter(
    (l) => l.habitId === habit.id && l.logDate === dateStr,
  );
  if (dayLogs.length === 0) return false;

  if (habit.target !== null) {
    const total = dayLogs.reduce((sum, l) => sum + l.amount, 0);
    return total >= habit.target;
  }

  return true;
}

export function computeStreak(
  habit: HabitInput,
  logs: HabitLogInput[],
  timezone: string,
  now?: Date,
): number {
  const today = formatDate(now ?? new Date(), timezone);

  const todayLogs = logs.filter(
    (l) => l.habitId === habit.id && l.logDate === today,
  );
  const todayComplete = isCompleteOnDate(habit, today, logs);

  if (habit.frequency.type === "daily" || habit.frequency.type === "fixed_weekdays") {
    if (!todayComplete && isDueOnDate(habit, today, logs)) return 0;
  } else {
    if (todayLogs.length === 0) return 0;
  }

  let streak = 0;
  let cursor = today;

  while (true) {
    const dateIsDue = isDueOnDate(habit, cursor, logs);

    if (dateIsDue) {
      const complete = isCompleteOnDate(habit, cursor, logs);
      if (!complete) break;
      streak++;
    }

    if (streak > 10_000) break;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function coerceFrequency(f: unknown): HabitFrequency {
  if (!f || typeof f !== "object") return { type: "daily" };
  const obj = f as Record<string, unknown>;
  if (obj.type === "times_per_week") {
    const times = Number(obj.times);
    if (times >= 1 && times <= 6 && Number.isInteger(times)) {
      return { type: "times_per_week", times };
    }
    return { type: "daily" };
  }
  if (obj.type === "fixed_weekdays") {
    if (Array.isArray(obj.days) && obj.days.length > 0 && obj.days.every((d: unknown) => typeof d === "number" && d >= 0 && d <= 6 && Number.isInteger(d))) {
      return { type: "fixed_weekdays", days: obj.days as number[] };
    }
    return { type: "daily" };
  }
  return { type: "daily" };
}
