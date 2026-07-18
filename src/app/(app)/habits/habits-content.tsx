"use client";

import { useMemo } from "react";
import { computeDueToday, computeStreak, todayDateString } from "@/habits/domain";
import {
  useArchiveHabit,
  useCheckHabit,
  useCreateHabit,
  useHabitLogs,
  useHabits,
  useSettings,
  useUncheckHabit,
  useUpdateHabit,
} from "@/habits/hooks";
import { HabitCard } from "@/components/habit-card";
import { HabitForm } from "@/components/habit-form";

export function HabitsContent() {
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const { data: logs, isLoading: logsLoading } = useHabitLogs();
  const { data: settings } = useSettings();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const archiveHabit = useArchiveHabit();
  const checkHabit = useCheckHabit();
  const uncheckHabit = useUncheckHabit();

  const timezone = settings?.timezone ?? "UTC";

  const dueToday = useMemo(() => {
    if (!habits) return [];
    const domainHabits = habits.map((h) => ({
      id: h.id,
      name: h.name,
      description: h.description,
      archived: h.archived,
    }));
    const domainLogs =
      logs?.map((l) => ({
        habitId: l.habitId,
        logDate: l.logDate,
      })) ?? [];
    return computeDueToday(domainHabits, domainLogs, timezone);
  }, [habits, logs, timezone]);

  const streaks = useMemo(() => {
    if (!logs) return new Map<string, number>();
    const domainLogs = logs.map((l) => ({
      habitId: l.habitId,
      logDate: l.logDate,
    }));
    const habitIds = new Set(logs.map((l) => l.habitId));
    const map = new Map<string, number>();
    for (const habitId of habitIds) {
      map.set(habitId, computeStreak(habitId, domainLogs, timezone));
    }
    return map;
  }, [logs, timezone]);

  function handleToggle(habitId: string, next: boolean) {
    const logDate = todayDateString(timezone);
    if (next) {
      checkHabit.mutate({ habitId, logDate });
    } else {
      uncheckHabit.mutate({ habitId, logDate });
    }
  }

  if (habitsLoading || logsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-[#8a8f98] text-[14px] leading-[1.5]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <HabitForm onCreate={(name, desc) => createHabit.mutate({ name, description: desc ?? undefined })} loading={createHabit.isPending} />

      {dueToday.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <p className="text-[#8a8f98] text-[14px] leading-[1.5]">
            No habits due today. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {dueToday.map(({ habit, done }) => (
            <HabitCard
              key={habit.id}
              id={habit.id}
              name={habit.name}
              description={habit.description}
              streak={streaks.get(habit.id) ?? 0}
              done={done}
              onToggle={(next) => handleToggle(habit.id, next)}
              onArchive={() => archiveHabit.mutate(habit.id)}
              onRename={(name, description) =>
                updateHabit.mutate({ id: habit.id, name, description })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
