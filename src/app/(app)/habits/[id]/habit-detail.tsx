"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  computeBestStreak,
  computeCompletionRate,
  computeStreak,
  computeYearHeatmap,
} from "@/habits/domain";
import { useHabitDetailProjection } from "@/habits/projection";
import { YearHeatmap } from "@/components/year-heatmap";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
}

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="border-hairline bg-surface-1 rounded-lg flex flex-col gap-1 border p-4">
      <span className="text-ink-tertiary text-[11px] font-medium leading-[1.3] tracking-[0.4px] uppercase">
        {label}
      </span>
      <span className="text-ink text-[28px] font-semibold leading-[1.2] tracking-[-0.6px]">
        {value}
      </span>
      {hint ? (
        <span className="text-ink-subtle text-[12px] leading-[1.4]">{hint}</span>
      ) : null}
    </div>
  );
}

function formatPercent(rate: number): string {
  if (rate === 0) return "0%";
  return `${Math.round(rate * 100)}%`;
}

function getAvailableYears(createdAt: string, nowYear: number): number[] {
  const createdYear = Number(createdAt.slice(0, 4));
  const years: number[] = [];
  for (let y = createdYear; y <= nowYear; y++) years.push(y);
  return years.reverse();
}

export function HabitDetail({ habitId }: { habitId: string }) {
  const {
    habit,
    logIndex,
    relapses,
    timezone,
    today,
    elapsedByHabit,
    isLoading,
    isError,
  } = useHabitDetailProjection(habitId);

  const currentYear = Number(today.slice(0, 4));

  const availableYears = useMemo(
    () => (habit ? getAvailableYears(habit.createdAt, currentYear) : []),
    [habit, currentYear],
  );

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const safeSelectedYear = availableYears.includes(selectedYear)
    ? selectedYear
    : currentYear;

  const relapseCount = relapses.length;

  const streak = useMemo(
    () => (habit ? computeStreak(habit, logIndex, timezone) : 0),
    [habit, logIndex, timezone],
  );

  const bestStreak = useMemo(
    () => (habit ? computeBestStreak(habit, logIndex, timezone) : 0),
    [habit, logIndex, timezone],
  );

  const completion = useMemo(() => {
    if (!habit) return { completed: 0, due: 0, rate: 0 };
    const yearStart = `${safeSelectedYear}-01-01`;
    const yearEnd = `${safeSelectedYear}-12-31`;
    return computeCompletionRate(habit, logIndex, yearStart, yearEnd, timezone);
  }, [habit, logIndex, timezone, safeSelectedYear]);

  const heatmapDays = useMemo(() => {
    if (!habit) return [];
    return computeYearHeatmap(
      habit,
      logIndex,
      relapses,
      safeSelectedYear,
      timezone,
    );
  }, [habit, logIndex, relapses, safeSelectedYear, timezone]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-ink-subtle text-[14px] leading-[1.5]">Loading...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <p className="text-ink-subtle text-[14px] leading-[1.5]">
          Failed to load habits.
        </p>
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <h2 className="text-ink text-[22px] font-medium tracking-[-0.4px]">
          Habit not found
        </h2>
        <Link
          href="/habits"
          className="text-primary text-[14px] font-medium leading-[1.2] hover:underline"
        >
          Back to habits
        </Link>
      </div>
    );
  }

  const isNegative = habit.habitType === "negative";
  const isArchived = habit.archived;
  const yearLabel = safeSelectedYear;
  const elapsedStr = elapsedByHabit.get(habit.id) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/habits"
        className="text-ink-subtle hover:text-ink inline-flex w-fit items-center gap-1.5 text-[13px] leading-[1.3] transition-colors"
      >
        <span aria-hidden>←</span> Back to habits
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-[28px] leading-[1.2] font-semibold tracking-[-0.6px] text-ink">
            {habit.name}
          </h1>
          {isArchived ? (
            <span className="bg-surface-2 text-ink-subtle rounded-full px-2 py-0.5 text-[11px] font-medium leading-[1.4]">
              Archived
            </span>
          ) : null}
        </div>
        {habit.description ? (
          <p className="text-ink-subtle text-[14px] leading-[1.5]">
            {habit.description}
          </p>
        ) : null}
      </header>

      <section
        aria-label="Stats"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {isNegative ? (
          <>
            <StatCard
              label="Since last relapse"
              value={elapsedStr ?? "—"}
            />
            <StatCard
              label="Relapses"
              value={String(relapseCount)}
              hint={
                relapseCount === 0
                  ? "No relapses recorded"
                  : "All time"
              }
            />
            <StatCard
              label="Tracking since"
              value={habit.createdAt.slice(0, 10)}
            />
          </>
        ) : (
          <>
            <StatCard
              label="Current streak"
              value={`${streak} day${streak === 1 ? "" : "s"}`}
              hint="Consecutive due days completed"
            />
            <StatCard
              label="Best streak"
              value={`${bestStreak} day${bestStreak === 1 ? "" : "s"}`}
              hint="Longest run ever"
            />
            <StatCard
              label={`Completion · ${yearLabel}`}
              value={formatPercent(completion.rate)}
              hint={
                completion.due > 0
                  ? `${completion.completed} / ${completion.due} due days`
                  : "No due days in range"
              }
            />
          </>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-ink text-[16px] font-semibold leading-[1.4] tracking-[-0.05px]">
            Year heatmap
          </h2>
          {availableYears.length > 0 ? (
            <div className="flex items-center gap-2">
              <label
                htmlFor="heatmap-year"
                className="text-ink-subtle text-[12px] leading-[1.3]"
              >
                Year
              </label>
              <select
                id="heatmap-year"
                value={safeSelectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-surface-1 border-hairline rounded-md border px-2 py-1 text-[13px] leading-[1.4] text-ink outline-none focus:border-primary-focus"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <YearHeatmap days={heatmapDays} />
        </motion.div>
      </section>
    </div>
  );
}