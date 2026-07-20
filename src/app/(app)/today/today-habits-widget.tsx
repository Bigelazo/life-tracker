"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { CheckIcon } from "@/components/check-icon";
import { EmptyState } from "@/components/empty-state";
import {
  computeDueToday,
  computeProgress,
  isoDateNDaysAgo,
} from "@/habits/domain";
import {
  useCheckHabit,
  useUncheckHabit,
} from "@/habits/hooks";
import { useHabitProjection } from "@/habits/projection";

/**
 * How far back the widget needs log history. The widget only renders
 * today's state, but `times_per_week` habits need the rest of the
 * current week to count completions — a 7-day window covers any
 * week-to-date walk. The negative-habit counter uses relapses, not
 * logs, so it doesn't widen this bound.
 */
const WIDGET_LOOKBACK_DAYS = 7;

export function TodayHabitsWidget() {
  const sinceDate = useMemo(() => isoDateNDaysAgo(WIDGET_LOOKBACK_DAYS), []);
  const {
    habits,
    logIndex,
    timezone,
    today,
    elapsedByHabit,
    isLoading,
  } = useHabitProjection({ since: sinceDate });

  const checkHabit = useCheckHabit();
  const uncheckHabit = useUncheckHabit();

  const dueToday = useMemo(
    () => (isLoading ? [] : computeDueToday(habits, logIndex, timezone)),
    [isLoading, habits, logIndex, timezone],
  );

  const progressByHabit = useMemo(() => {
    const map = new Map<
      string,
      { current: number; target: number | null; unit: string | null }
    >();
    for (const habit of habits) {
      map.set(habit.id, computeProgress(habit, today, logIndex));
    }
    return map;
  }, [habits, logIndex, today]);

  const completedCount = useMemo(
    () => dueToday.filter((d) => d.done).length,
    [dueToday],
  );

  if (isLoading) {
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

  return (
    <section
      aria-label="Today's habits"
      data-testid="today-habits-widget"
      className="border-hairline bg-surface-1 rounded-lg flex flex-col gap-1 border p-3"
    >
      <header className="flex items-baseline justify-between px-2 pt-1 pb-3">
        <h2 className="text-ink text-[22px] leading-[1.25] font-medium tracking-[-0.4px]">
          Today&apos;s habits
        </h2>
        <span className="text-ink-subtle text-[12px] leading-[1.3] font-medium">
          {completedCount} of {dueToday.length} done
        </span>
      </header>

      <ul className="flex flex-col">
        <AnimatePresence initial={false}>
          {dueToday.map(({ habit, done }) => {
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
                ) : (
                  <HabitCheckbox
                    done={done}
                    name={habit.name}
                    onToggle={(next) => handleToggle(habit.id, next)}
                    readOnly={isQuantifiable}
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

      <footer className="mt-1 flex justify-end border-t border-hairline px-2 pt-3">
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

function HabitCheckbox({
  done,
  name,
  onToggle,
  readOnly,
}: {
  done: boolean;
  name: string;
  onToggle: (next: boolean) => void;
  /**
   * Quantifiable habits' "done" state is reached by accumulating
   * amounts via the `+` button, not by clicking the checkbox. The
   * checkbox is kept as a read-only visual so the row reads
   * consistently with boolean habits.
   */
  readOnly?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!done)}
      disabled={readOnly}
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `Unmark ${name} as done` : `Mark ${name} as done`}
      data-testid="habit-checkbox"
      className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors disabled:cursor-default"
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