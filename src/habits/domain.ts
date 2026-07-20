export type HabitFrequency =
  | { type: "daily" }
  | { type: "times_per_week"; times: number }
  | { type: "fixed_weekdays"; days: number[] };

export type HabitType = "positive" | "negative";

export interface HabitInput {
  id: string;
  name: string;
  description: string | null;
  archived: boolean;
  habitType: HabitType;
  frequency: HabitFrequency;
  target: number | null;
  unit: string | null;
  createdAt: string;
}

export interface HabitLogInput {
  habitId: string;
  logDate: string;
  amount: number;
}

export interface RelapseInput {
  id: string;
  habitId: string;
  relapsedAt: string;
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

/**
 * Indexed view of the logs used by every per-habit computation below.
 *   `byHabit`     — Map<habitId, HabitLog[]>     preserves insertion order
 *   `byHabitDate` — Map<habitId, Map<dateStr, totalAmount>>
 *   `completed`   — Map<habitId, Set<dateStr>>   days that count as "done"
 *
 * Build it once per `logs` reference and re-use it across `useMemo`s.
 * This is the single biggest perf win: every previous implementation
 * called `logs.filter(...)` inside the per-day loop of `computeStreak` /
 * `computeBestStreak` / `computeYearHeatmap`, costing O(days × N_logs).
 */
export interface LogIndex {
  byHabit: Map<string, HabitLogInput[]>;
  byHabitDate: Map<string, Map<string, number>>;
  completed: Map<string, Set<string>>;
}

export function buildLogIndex(logs: readonly HabitLogInput[]): LogIndex {
  const byHabit = new Map<string, HabitLogInput[]>();
  const byHabitDate = new Map<string, Map<string, number>>();
  const completed = new Map<string, Set<string>>();
  for (const l of logs) {
    let habitLogs = byHabit.get(l.habitId);
    if (!habitLogs) {
      habitLogs = [];
      byHabit.set(l.habitId, habitLogs);
    }
    habitLogs.push(l);

    let dateMap = byHabitDate.get(l.habitId);
    if (!dateMap) {
      dateMap = new Map();
      byHabitDate.set(l.habitId, dateMap);
    }
    dateMap.set(l.logDate, (dateMap.get(l.logDate) ?? 0) + l.amount);

    let dates = completed.get(l.habitId);
    if (!dates) {
      dates = new Set();
      completed.set(l.habitId, dates);
    }
    dates.add(l.logDate);
  }
  return { byHabit, byHabitDate, completed };
}

/**
 * Cap on how far `computeStreak` walks back from today. The current
 * streak is bounded by the present, so 10 years of "due days" is more
 * than any realistic case — this is a defensive bound, not a correctness
 * one. The full-history walks in `computeBestStreak` and
 * `computeCompletionRate` use a separate, larger bound (HISTORY_MAX_DAYS)
 * since they have to cover the full createdAt → today range.
 */
const CURRENT_STREAK_MAX_DAYS = 3650;

/**
 * Cap on the date-walking loops in `computeBestStreak` and
 * `computeCompletionRate`. 80k days ≈ 219 years, well beyond any
 * realistic habit's lifespan. Defensive only — a real render stops at
 * `today` long before this.
 */
const HISTORY_MAX_DAYS = 80_000;

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
  logsOrIndex: HabitLogInput[] | LogIndex,
): boolean {
  const index = ensureIndex(logsOrIndex);
  if (habit.archived) return false;

  if (habit.habitType === "negative") return true;

  const freq = habit.frequency;

  if (freq.type === "daily") return true;

  if (freq.type === "fixed_weekdays") {
    const info = getDateInfo(dateStr);
    return freq.days.includes(info.weekday);
  }

  if (freq.type === "times_per_week") {
    const weekStart = getWeekStart(dateStr);
    const habitDates = index.completed.get(habit.id);
    if (!habitDates) return true;
    let count = 0;
    for (const d of habitDates) {
      if (d >= weekStart && d < dateStr) count++;
    }
    return count < freq.times;
  }

  return true;
}

/**
 * Backwards-compatible wrapper. New code should pass an `index`; this
 * exists so existing call sites that still pass a flat `logs` array
 * keep working (it builds the index lazily).
 */
function ensureIndex(logsOrIndex: HabitLogInput[] | LogIndex): LogIndex {
  if (Array.isArray(logsOrIndex)) return buildLogIndex(logsOrIndex);
  return logsOrIndex;
}

export function computeDueToday(
  habits: HabitInput[],
  logsOrIndex: HabitLogInput[] | LogIndex,
  timezone: string,
  now?: Date,
): Array<{ habit: HabitInput; done: boolean }> {
  const today = formatDate(now ?? new Date(), timezone);
  const index = ensureIndex(logsOrIndex);
  return habits
    .filter((h) => !h.archived && isDueOnDate(h, today, index))
    .map((h) => ({
      habit: h,
      done: isCompleteOnDate(h, today, index),
    }));
}

export function computeProgress(
  habit: HabitInput,
  dateStr: string,
  logsOrIndex: HabitLogInput[] | LogIndex,
): { current: number; target: number | null; unit: string | null } {
  const index = ensureIndex(logsOrIndex);
  const total = index.byHabitDate.get(habit.id)?.get(dateStr) ?? 0;
  return { current: total, target: habit.target, unit: habit.unit };
}

export function isCompleteOnDate(
  habit: HabitInput,
  dateStr: string,
  logsOrIndex: HabitLogInput[] | LogIndex,
): boolean {
  if (habit.habitType === "negative") return false;
  const index = ensureIndex(logsOrIndex);
  const total = index.byHabitDate.get(habit.id)?.get(dateStr) ?? 0;
  if (total === 0) return false;
  if (habit.target !== null) return total >= habit.target;
  return true;
}

export function computeStreak(
  habit: HabitInput,
  logsOrIndex: HabitLogInput[] | LogIndex,
  timezone: string,
  now?: Date,
): number {
  if (habit.habitType === "negative") return 0;
  const index = ensureIndex(logsOrIndex);
  const today = formatDate(now ?? new Date(), timezone);

  const todayComplete = isCompleteOnDate(habit, today, index);

  if (!todayComplete && isDueOnDate(habit, today, index)) return 0;

  let streak = 0;
  let cursor = today;

  for (let i = 0; i < CURRENT_STREAK_MAX_DAYS; i++) {
    const dateIsDue = isDueOnDate(habit, cursor, index);

    if (dateIsDue) {
      const complete = isCompleteOnDate(habit, cursor, index);
      if (!complete) break;
      streak++;
    }

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

export function coerceHabitType(t: unknown): HabitType {
  if (t === "negative") return "negative";
  return "positive";
}

export interface ElapsedTime {
  days: number;
  hours: number;
}

export function computeElapsedSince(
  habit: HabitInput,
  relapses: RelapseInput[],
  now?: Date,
): ElapsedTime {
  const nowDate = now ?? new Date();
  const latestRelapse = relapses
    .filter((r) => r.habitId === habit.id)
    .sort((a, b) => new Date(b.relapsedAt).getTime() - new Date(a.relapsedAt).getTime())[0];

  const referenceDate = latestRelapse
    ? new Date(latestRelapse.relapsedAt)
    : new Date(habit.createdAt);

  const diffMs = nowDate.getTime() - referenceDate.getTime();
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  return { days, hours };
}

export function formatElapsed(elapsed: ElapsedTime): string {
  if (elapsed.days > 0) {
    const dayPart = `${elapsed.days} day${elapsed.days !== 1 ? "s" : ""}`;
    if (elapsed.hours > 0) {
      return `${dayPart} ${elapsed.hours} hr`;
    }
    return dayPart;
  }
  if (elapsed.hours > 0) {
    return `${elapsed.hours} hr`;
  }
  return "now";
}

export function computeBestStreak(
  habit: HabitInput,
  logsOrIndex: HabitLogInput[] | LogIndex,
  timezone: string,
  now?: Date,
): number {
  if (habit.habitType === "negative") return 0;
  const index = ensureIndex(logsOrIndex);
  const today = formatDate(now ?? new Date(), timezone);
  const createdAtDate = formatDate(new Date(habit.createdAt), timezone);

  let best = 0;
  let current = 0;
  let cursor = createdAtDate;

  for (let i = 0; i < HISTORY_MAX_DAYS; i++) {
    if (cursor > today) break;

    if (isDueOnDate(habit, cursor, index)) {
      if (isCompleteOnDate(habit, cursor, index)) {
        current++;
        if (current > best) best = current;
      } else {
        current = 0;
      }
    }

    cursor = addDays(cursor, 1);
  }

  return best;
}

export interface CompletionRate {
  completed: number;
  due: number;
  rate: number;
}

export function computeCompletionRate(
  habit: HabitInput,
  logsOrIndex: HabitLogInput[] | LogIndex,
  startDate: string,
  endDate: string,
  timezone: string,
  now?: Date,
): CompletionRate {
  if (habit.habitType === "negative") {
    return { completed: 0, due: 0, rate: 0 };
  }
  const index = ensureIndex(logsOrIndex);

  const today = formatDate(now ?? new Date(), timezone);
  const createdAtDate = formatDate(new Date(habit.createdAt), timezone);

  const effectiveStart = startDate > createdAtDate ? startDate : createdAtDate;
  const effectiveEnd = endDate < today ? endDate : today;

  if (effectiveStart > effectiveEnd) {
    return { completed: 0, due: 0, rate: 0 };
  }

  let due = 0;
  let completed = 0;
  let cursor = effectiveStart;

  for (let i = 0; i < HISTORY_MAX_DAYS; i++) {
    if (cursor > effectiveEnd) break;
    if (isDueOnDate(habit, cursor, index)) {
      due++;
      if (isCompleteOnDate(habit, cursor, index)) completed++;
    }
    cursor = addDays(cursor, 1);
  }

  return {
    completed,
    due,
    rate: due === 0 ? 0 : completed / due,
  };
}

export type DayStatus =
  | "done"
  | "missed"
  | "not-due"
  | "relapse"
  | "before-creation";

export interface HeatmapDay {
  date: string;
  status: DayStatus;
}

function daysInYear(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

export function computeYearHeatmap(
  habit: HabitInput,
  logsOrIndex: HabitLogInput[] | LogIndex,
  relapses: RelapseInput[],
  year: number,
  timezone: string,
  now?: Date,
): HeatmapDay[] {
  const start = `${year}-01-01`;
  const totalDays = daysInYear(year);
  const today = formatDate(now ?? new Date(), timezone);
  const createdAtDate = formatDate(new Date(habit.createdAt), timezone);
  const index = ensureIndex(logsOrIndex);

  const relapseDates = new Set<string>();
  for (const r of relapses) {
    if (r.habitId === habit.id) {
      relapseDates.add(formatDate(new Date(r.relapsedAt), timezone));
    }
  }

  const result: HeatmapDay[] = [];
  let cursor = start;

  for (let i = 0; i < totalDays; i++) {
    let status: DayStatus;

    if (cursor < createdAtDate) {
      status = "before-creation";
    } else if (cursor > today) {
      status = "not-due";
    } else if (habit.habitType === "negative") {
      status = relapseDates.has(cursor) ? "relapse" : "done";
    } else if (!isDueOnDate(habit, cursor, index)) {
      status = "not-due";
    } else if (isCompleteOnDate(habit, cursor, index)) {
      status = "done";
    } else {
      status = "missed";
    }

    result.push({ date: cursor, status });
    cursor = addDays(cursor, 1);
  }

  return result;
}
