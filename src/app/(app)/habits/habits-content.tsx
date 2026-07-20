"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildLogIndex,
  computeDueToday,
  computeElapsedSince,
  computeProgress,
  computeStreak,
  formatElapsed,
  isoDateNDaysAgo,
  todayDateString,
} from "@/habits/domain";
import type { HabitInput, LogIndex, RelapseInput } from "@/habits/domain";
import {
  useAllRelapses,
  useArchiveHabit,
  useCheckHabit,
  useCreateHabit,
  useHabitLogs,
  useHabits,
  useRecordRelapse,
  useSettings,
  useUncheckHabit,
  useUpdateHabit,
} from "@/habits/hooks";
import { HabitCard } from "@/components/habit-card";
import { HabitForm } from "@/components/habit-form";

/**
 * How far back the list view needs log history. The streak badge on each
 * card is bounded to this window, which is the single biggest reason the
 * `/api/habits/logs` payload stays small regardless of how long the user
 * has tracked. The detail view requests a per-habit slice without this
 * bound. Relapses are NOT bounded — `computeElapsedSince` needs every
 * row so a habit that hasn't relapsed in 6 months still shows the right
 * counter, not "time since creation".
 */
const LIST_LOOKBACK_DAYS = 90;

export function HabitsContent() {
  const sinceDate = useMemo(() => isoDateNDaysAgo(LIST_LOOKBACK_DAYS), []);

  const { data: habits, isLoading: habitsLoading, isError: habitsError, error: habitsErr } = useHabits();
  const { data: logs, isLoading: logsLoading, isError: logsError } = useHabitLogs({ since: sinceDate });
  const { data: relapseRecords } = useAllRelapses();
  const { data: settings } = useSettings();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const archiveHabit = useArchiveHabit();
  const checkHabit = useCheckHabit();
  const uncheckHabit = useUncheckHabit();
  const recordRelapse = useRecordRelapse();

  const timezone = settings?.timezone ?? "UTC";

  // Tick invalidates the elapsed-time memo once a minute so the negative
  // habit counters on the list stay fresh without a full re-render.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const domainHabits: HabitInput[] = useMemo(
    () =>
      (habits ?? []).map((h) => ({
        id: h.id,
        name: h.name,
        description: h.description,
        archived: h.archived,
        habitType: h.habitType,
        frequency: h.frequency,
        target: h.target,
        unit: h.unit,
        createdAt: h.createdAt,
      })),
    [habits],
  );

  const domainLogs = useMemo(
    () =>
      (logs ?? []).map((l) => ({
        habitId: l.habitId,
        logDate: l.logDate,
        amount: l.amount,
      })),
    [logs],
  );

  const domainRelapses: RelapseInput[] = useMemo(
    () =>
      (relapseRecords ?? []).map((r) => ({
        id: r.id,
        habitId: r.habitId,
        relapsedAt: r.relapsedAt,
      })),
    [relapseRecords],
  );

  // Build the index once per logs reference; every per-habit computation
  // below reuses it instead of re-filtering the full array.
  const logIndex: LogIndex = useMemo(() => buildLogIndex(domainLogs), [domainLogs]);

  const dueToday = useMemo(() => {
    if (!habits) return [];
    return computeDueToday(domainHabits, logIndex, timezone);
  }, [habits, domainHabits, logIndex, timezone]);

  const streaks = useMemo(() => {
    if (!habits || !logs) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const habit of domainHabits) {
      map.set(habit.id, computeStreak(habit, logIndex, timezone));
    }
    return map;
  }, [habits, logs, domainHabits, logIndex, timezone]);

  const progressMap = useMemo(() => {
    const today = todayDateString(timezone);
    const map = new Map<string, { current: number; target: number | null; unit: string | null }>();
    for (const habit of domainHabits) {
      map.set(habit.id, computeProgress(habit, today, logIndex));
    }
    return map;
  }, [domainHabits, logIndex, timezone]);

  const elapsedMap = useMemo(() => {
    const map = new Map<string, string>();
    const now = new Date();
    for (const habit of domainHabits) {
      if (habit.habitType === "negative") {
        const elapsed = computeElapsedSince(habit, domainRelapses, now);
        map.set(habit.id, formatElapsed(elapsed));
      }
    }
    return map;
    // tick invalidates once a minute so the counter stays fresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainHabits, domainRelapses, tick]);

  function handleToggle(habitId: string, next: boolean) {
    const logDate = todayDateString(timezone);
    if (next) {
      checkHabit.mutate({ habitId, logDate });
    } else {
      uncheckHabit.mutate({ habitId, logDate });
    }
  }

  function handleAddAmount(habitId: string, amount: number) {
    const logDate = todayDateString(timezone);
    checkHabit.mutate({ habitId, logDate, amount });
  }

  function handleCreate(data: {
    name: string;
    description: string | null;
    habitType: unknown;
    frequency: unknown;
    target: number | null;
    unit: string | null;
  }) {
    createHabit.mutate(data as Parameters<typeof createHabit.mutate>[0]);
  }

  if (habitsLoading || logsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-[#8a8f98] text-[14px] leading-[1.5]">Loading...</p>
      </div>
    );
  }

  if (habitsError || logsError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <p className="text-[#8a8f98] text-[14px] leading-[1.5]">
          Failed to load habits. Check that the database migration has been applied.
        </p>
        {habitsErr && (
          <p className="text-[#62666d] text-[12px] leading-[1.4]">
            {(habitsErr as Error).message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <HabitForm onCreate={handleCreate} loading={createHabit.isPending} />

      {dueToday.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <p className="text-[#8a8f98] text-[14px] leading-[1.5]">
            No habits due today. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {dueToday.map(({ habit, done }) => {
            const progress = progressMap.get(habit.id);
            const isNegative = habit.habitType === "negative";
            return (
              <HabitCard
                key={habit.id}
                id={habit.id}
                name={habit.name}
                description={habit.description}
                streak={streaks.get(habit.id) ?? 0}
                done={done}
                target={habit.target}
                unit={habit.unit}
                currentAmount={progress?.current ?? 0}
                isNegative={isNegative}
                elapsed={isNegative ? (elapsedMap.get(habit.id) ?? null) : null}
                onToggle={(next) => handleToggle(habit.id, next)}
                onArchive={() => archiveHabit.mutate(habit.id)}
                onRename={(name, description) =>
                  updateHabit.mutate({ id: habit.id, name, description })
                }
                onAddAmount={(amount) => handleAddAmount(habit.id, amount)}
                onRelapse={() =>
                  recordRelapse.mutate({ habitId: habit.id })
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
