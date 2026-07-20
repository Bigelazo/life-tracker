"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { CheckIcon } from "@/components/check-icon";
import { EmptyState } from "@/components/empty-state";
import {
  buildLogIndex,
  computeDueToday,
  computeElapsedSince,
  computeProgress,
  formatElapsed,
  isoDateNDaysAgo,
  todayDateString,
} from "@/habits/domain";
import type { LogIndex } from "@/habits/domain";
import {
  useAllRelapses,
  useCheckHabit,
  useHabitLogs,
  useHabits,
  useSettings,
  useUncheckHabit,
} from "@/habits/hooks";
import type { HabitLogResponse, HabitResponse, RelapseResponse } from "@/habits/api-types";

/**
 * How far back the widget needs log history. The widget only renders
 * today's state, but `times_per_week` habits need the rest of the
 * current week to count completions — a 7-day window covers any
 * week-to-date walk. The negative-habit counter uses relapses, not
 * logs, so it doesn't widen this bound.
 */
const WIDGET_LOOKBACK_DAYS = 7;

function isLoadingHabits(
  habits: HabitResponse[] | undefined,
  logs: HabitLogResponse[] | undefined,
  relapses: RelapseResponse[] | undefined,
): boolean {
  return habits === undefined || logs === undefined || relapses === undefined;
}

interface TodayHabitsWidgetProps {
  /**
   * Maximum number of rows to render. Anything past this bound still
   * counts toward the header summary, but is hidden behind a "+N more"
   * link to /habits. Defaults to no cap — the widget is the primary
   * morning surface, and the owner wants to see everything due today.
   */
  maxRows?: number;
}

export function TodayHabitsWidget({ maxRows }: TodayHabitsWidgetProps = {}) {
  const sinceDate = useMemo(() => isoDateNDaysAgo(WIDGET_LOOKBACK_DAYS), []);

  const { data: habits } = useHabits();
  const { data: logs } = useHabitLogs({ since: sinceDate });
  const { data: relapseRecords } = useAllRelapses();
  const { data: settings } = useSettings();
  const checkHabit = useCheckHabit();
  const uncheckHabit = useUncheckHabit();

  const timezone = settings?.timezone ?? "UTC";

  // Tick invalidates the elapsed-time memo once a minute so the negative
  // habit counter stays fresh without a full re-render.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const domainHabits = useMemo(
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

  const domainRelapses = useMemo(
    () =>
      (relapseRecords ?? []).map((r) => ({
        id: r.id,
        habitId: r.habitId,
        relapsedAt: r.relapsedAt,
      })),
    [relapseRecords],
  );

  const logIndex: LogIndex = useMemo(() => buildLogIndex(domainLogs), [domainLogs]);

  const dueToday = useMemo(
    () => computeDueToday(domainHabits, logIndex, timezone),
    [domainHabits, logIndex, timezone],
  );

  const today = todayDateString(timezone);

  const progressByHabit = useMemo(() => {
    const map = new Map<
      string,
      { current: number; target: number | null; unit: string | null }
    >();
    for (const habit of domainHabits) {
      map.set(habit.id, computeProgress(habit, today, logIndex));
    }
    return map;
  }, [domainHabits, logIndex, today]);

  const elapsedByHabit = useMemo(() => {
    const map = new Map<string, string>();
    const now = new Date();
    for (const habit of domainHabits) {
      if (habit.habitType === "negative") {
        map.set(habit.id, formatElapsed(computeElapsedSince(habit, domainRelapses, now)));
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainHabits, domainRelapses, tick]);

  const completedCount = useMemo(
    () => dueToday.filter((d) => d.done).length,
    [dueToday],
  );

  if (isLoadingHabits(habits, logs, relapseRecords)) {
    return (
      <div className="border-hairline bg-surface-1 rounded-lg flex items-center justify-center border p-8">
        <p className="text-ink-subtle text-[14px] leading-[1.5]">Loading…</p>
      </div>
    );
  }

  if (dueToday.length === 0) {
    return (
      <EmptyState
        slug="habits"
        title="Nothing due today"
        description="You're caught up. New habits will appear here as soon as they're due."
      />
    );
  }

  const visibleRows =
    typeof maxRows === "number" ? dueToday.slice(0, maxRows) : dueToday;
  const overflow = Math.max(0, dueToday.length - visibleRows.length);
  const hasOverflow = overflow > 0;

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

  return (
    <section
      aria-label="Today's habits"
      data-testid="today-habits-widget"
      className="border-hairline bg-surface-1 rounded-lg flex flex-col gap-1 border p-3"
    >
      <header className="flex items-baseline justify-between px-2 pt-1 pb-3">
        <h2 className="text-ink text-[16px] font-semibold leading-[1.4] tracking-[-0.05px]">
          Today&apos;s habits
        </h2>
        <span className="text-ink-subtle text-[12px] leading-[1.3] font-medium">
          {completedCount} of {dueToday.length} done
        </span>
      </header>

      <ul className="flex flex-col">
        <AnimatePresence initial={false}>
          {visibleRows.map(({ habit, done }) => {
            const isNegative = habit.habitType === "negative";
            const isQuantifiable = habit.target !== null;
            const progress = progressByHabit.get(habit.id);
            const elapsed = isNegative ? elapsedByHabit.get(habit.id) ?? null : null;

            return (
              <motion.li
                key={habit.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="rounded-md flex items-center gap-3 px-2 py-2 transition-colors hover:bg-surface-2/60"
              >
                {isNegative ? (
                  <span
                    aria-hidden
                    className="border-hairline-strong flex size-5 shrink-0 items-center justify-center rounded-sm border"
                  />
                ) : isQuantifiable ? (
                  <ProgressCheckbox
                    done={done}
                    name={habit.name}
                    onToggle={(next) => handleToggle(habit.id, next)}
                  />
                ) : (
                  <BooleanCheckbox
                    done={done}
                    name={habit.name}
                    onToggle={(next) => handleToggle(habit.id, next)}
                  />
                )}

                <Link
                  href={`/habits/${habit.id}`}
                  className={`min-w-0 flex-1 truncate text-[14px] leading-[1.4] transition-colors hover:text-ink-muted ${
                    done ? "text-ink-subtle line-through" : "text-ink"
                  }`}
                  aria-label={`View details for ${habit.name}`}
                >
                  {habit.name}
                </Link>

                {isQuantifiable ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-ink-subtle text-[11px] leading-[1.3] font-medium">
                      {progress?.current ?? 0} / {habit.target} {habit.unit ?? ""}
                    </span>
                    <AddAmountButton
                      onAdd={(amount) => handleAddAmount(habit.id, amount)}
                    />
                  </div>
                ) : null}

                {isNegative && elapsed ? (
                  <span className="bg-surface-2 text-ink-subtle shrink-0 rounded-full px-2 py-0.5 text-[11px] leading-[1.4] font-medium">
                    {elapsed}
                  </span>
                ) : null}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <footer className="mt-1 flex items-center justify-between border-t border-hairline px-2 pt-3">
        {hasOverflow ? (
          <span className="text-ink-tertiary text-[12px] leading-[1.3]">
            +{overflow} more
          </span>
        ) : (
          <span />
        )}
        <Link
          href="/habits"
          className="text-ink-subtle hover:text-ink text-[12px] leading-[1.3] font-medium transition-colors"
        >
          View all habits →
        </Link>
      </footer>
    </section>
  );
}

function BooleanCheckbox({
  done,
  name,
  onToggle,
}: {
  done: boolean;
  name: string;
  onToggle: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!done)}
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `Unmark ${name} as done` : `Mark ${name} as done`}
      data-testid="habit-checkbox"
      className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors"
      style={{
        borderColor: done ? "var(--color-primary)" : "var(--color-hairline-strong)",
        backgroundColor: done ? "var(--color-primary)" : "transparent",
      }}
    >
      {done ? <CheckIcon className="size-3 text-white" /> : null}
    </button>
  );
}

function ProgressCheckbox({
  done,
  name,
  onToggle,
}: {
  done: boolean;
  name: string;
  onToggle: (next: boolean) => void;
}) {
  // For quantifiable habits the checkbox is a "+1" surface that contributes
  // a single unit; the day is "done" only when the cumulative amount
  // reaches the target. We still expose the checked/unchecked visual so
  // the row reads consistently with boolean habits.
  return (
    <button
      type="button"
      onClick={() => onToggle(true)}
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `${name} target reached` : `Add one ${name}`}
      data-testid="habit-progress-checkbox"
      className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors"
      style={{
        borderColor: done ? "var(--color-primary)" : "var(--color-hairline-strong)",
        backgroundColor: done ? "var(--color-primary)" : "transparent",
      }}
    >
      {done ? <CheckIcon className="size-3 text-white" /> : null}
    </button>
  );
}

function AddAmountButton({ onAdd }: { onAdd: (amount: number) => void }) {
  return (
    <button
      type="button"
      onClick={() => onAdd(1)}
      aria-label="Add one"
      data-testid="habit-add-amount"
      className="border-hairline hover:bg-surface-3 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md border text-[13px] leading-none font-medium transition-colors"
    >
      +
    </button>
  );
}
