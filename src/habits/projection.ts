"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildLogIndex,
  computeElapsedSince,
  formatElapsed,
  todayDateString,
} from "./domain";
import type { HabitInput, HabitLogInput, LogIndex, RelapseInput } from "./domain";
import {
  useAllRelapses,
  useHabitLogs,
  useHabitRelapses,
  useHabits,
  useSettings,
} from "./hooks";
import type {
  HabitLogResponse,
  HabitResponse,
  RelapseResponse,
} from "./api-types";

/**
 * Adapter mappers — Response (wire shape) → Input (domain shape).
 * Private to this module; views never see HabitResponse/RelapseResponse
 * /HabitLogResponse directly.
 */
function toHabitInput(h: {
  id: string;
  name: string;
  description: string | null;
  archived: boolean;
  habitType: HabitInput["habitType"];
  frequency: HabitInput["frequency"];
  target: number | null;
  unit: string | null;
  createdAt: string;
}): HabitInput {
  return {
    id: h.id,
    name: h.name,
    description: h.description,
    archived: h.archived,
    habitType: h.habitType,
    frequency: h.frequency,
    target: h.target,
    unit: h.unit,
    createdAt: h.createdAt,
  };
}

function toLogInput(l: { habitId: string; logDate: string; amount: number }): HabitLogInput {
  return { habitId: l.habitId, logDate: l.logDate, amount: l.amount };
}

function toRelapseInput(r: { id: string; habitId: string; relapsedAt: string }): RelapseInput {
  return { id: r.id, habitId: r.habitId, relapsedAt: r.relapsedAt };
}

/**
 * Ticks once a minute so the per-habit elapsed-time map for negative
 * habits stays fresh without a full re-render. One projection owns
 * this; views no longer each start their own setInterval.
 */
function useTicker(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);
  return tick;
}

interface HabitQuery<T> {
  data: T | undefined;
  isError: boolean;
  error: Error | null;
  isLoading?: boolean;
}

export interface HabitProjection {
  /** Domain-shaped habits, ready to feed computeStreak etc. */
  habits: HabitInput[];
  /** Per-habit log index, built once per logs reference. */
  logIndex: LogIndex;
  /** Domain-shaped relapses for the projection's scope. */
  relapses: RelapseInput[];
  /** User's configured timezone (defaults to UTC until settings load). */
  timezone: string;
  /** Today's ISO date in the user's timezone. */
  today: string;
  /** Pre-formatted elapsed strings for negative habits (e.g. "3 days 4 hr"). */
  elapsedByHabit: Map<string, string>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

interface QueryRefs {
  habits: HabitQuery<HabitResponse[]>;
  logs: HabitQuery<HabitLogResponse[]>;
  relapses: HabitQuery<RelapseResponse[]>;
  settings: HabitQuery<{ timezone: string }>;
  tick: number;
}

function useProjectionState(q: QueryRefs): HabitProjection {
  const timezone = q.settings.data?.timezone ?? "UTC";

  const habits = useMemo<HabitInput[]>(
    () => (q.habits.data ?? []).map(toHabitInput),
    [q.habits.data],
  );

  const logs = useMemo<HabitLogInput[]>(
    () => (q.logs.data ?? []).map(toLogInput),
    [q.logs.data],
  );

  const relapses = useMemo<RelapseInput[]>(
    () => (q.relapses.data ?? []).map(toRelapseInput),
    [q.relapses.data],
  );

  const logIndex: LogIndex = useMemo(() => buildLogIndex(logs), [logs]);

  const today = todayDateString(timezone);

  // Negative-habit counter map. Ticker invalidates once a minute so the
  // "since last relapse" values stay fresh; the underlying data hasn't
  // changed, so this is a memo that depends on tick only for freshness.
  const elapsedByHabit = useMemo<Map<string, string>>(
    () => {
      const map = new Map<string, string>();
      const now = new Date();
      for (const h of habits) {
        if (h.habitType === "negative") {
          map.set(h.id, formatElapsed(computeElapsedSince(h, relapses, now)));
        }
      }
      return map;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [habits, relapses, q.tick],
  );

  const isLoading =
    q.habits.data === undefined ||
    q.logs.data === undefined ||
    q.relapses.data === undefined;
  const isError = q.habits.isError || q.logs.isError || q.relapses.isError;
  const error = q.habits.error ?? q.logs.error ?? q.relapses.error ?? null;

  return {
    habits,
    logIndex,
    relapses,
    timezone,
    today,
    elapsedByHabit,
    isLoading,
    isError,
    error,
  };
}

/**
 * Habit projection for the list / Today views. All habits, all
 * relapses, and logs bounded by the passed `since` lower bound.
 */
export function useHabitProjection(options: { since?: string | null } = {}): HabitProjection {
  const { since = null } = options;
  const habitsQ = useHabits();
  const logsQ = useHabitLogs({ since });
  const relapsesQ = useAllRelapses();
  const settingsQ = useSettings();
  const tick = useTicker();
  return useProjectionState({
    habits: habitsQ,
    logs: logsQ,
    relapses: relapsesQ,
    settings: settingsQ,
    tick,
  });
}

/**
 * Habit projection for the detail view. All habits (so the page can
 * render the header), but logs and relapses scoped to one habit.
 */
export interface HabitDetailProjection extends HabitProjection {
  /** The single habit being viewed, or null when not yet loaded. */
  habit: HabitInput | null;
  /** Domain-shaped relapses already filtered to this habit. */
}

export function useHabitDetailProjection(habitId: string): HabitDetailProjection {
  const habitsQ = useHabits();
  const logsQ = useHabitLogs({ habitId });
  const relapsesQ = useHabitRelapses(habitId);
  const settingsQ = useSettings();
  const tick = useTicker();
  const state = useProjectionState({
    habits: habitsQ,
    logs: logsQ,
    relapses: relapsesQ,
    settings: settingsQ,
    tick,
  });

  const habit = useMemo<HabitInput | null>(
    () => state.habits.find((h) => h.id === habitId) ?? null,
    [state.habits, habitId],
  );

  return { ...state, habit };
}