"use client";

import { useMemo } from "react";
import {
  computeDueToday,
  computeProgress,
  computeStreak,
  isoDateNDaysAgo,
} from "@/habits/domain";
import {
  useArchiveHabit,
  useCheckHabit,
  useCreateHabit,
  useRecordRelapse,
  useUncheckHabit,
  useUpdateHabit,
} from "@/habits/hooks";
import { useHabitProjection } from "@/habits/projection";
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
  const {
    habits,
    logIndex,
    timezone,
    today,
    elapsedByHabit,
    isLoading,
    isError,
    error,
  } = useHabitProjection({ since: sinceDate });

  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const archiveHabit = useArchiveHabit();
  const checkHabit = useCheckHabit();
  const uncheckHabit = useUncheckHabit();
  const recordRelapse = useRecordRelapse();

  const dueToday = useMemo(
    () => (isLoading ? [] : computeDueToday(habits, logIndex, timezone)),
    [isLoading, habits, logIndex, timezone],
  );

  const streaks = useMemo(() => {
    if (isLoading) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const habit of habits) {
      map.set(habit.id, computeStreak(habit, logIndex, timezone));
    }
    return map;
  }, [isLoading, habits, logIndex, timezone]);

  const progressMap = useMemo(() => {
    const map = new Map<string, { current: number; target: number | null; unit: string | null }>();
    for (const habit of habits) {
      map.set(habit.id, computeProgress(habit, today, logIndex));
    }
    return map;
  }, [habits, logIndex, today]);

  function handleToggle(habitId: string, next: boolean) {
    const logDate = today;
    if (next) {
      checkHabit.mutate({ habitId, logDate });
    } else {
      uncheckHabit.mutate({ habitId, logDate });
    }
  }

  function handleAddAmount(habitId: string, amount: number) {
    checkHabit.mutate({ habitId, logDate: today, amount });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-[#8a8f98] text-[14px] leading-[1.5]">Loading...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <p className="text-[#8a8f98] text-[14px] leading-[1.5]">
          Failed to load habits. Check that the database migration has been applied.
        </p>
        {error && (
          <p className="text-[#62666d] text-[12px] leading-[1.4]">
            {error.message}
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
                elapsed={isNegative ? (elapsedByHabit.get(habit.id) ?? null) : null}
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