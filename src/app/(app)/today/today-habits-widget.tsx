"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
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

const DEFAULT_AMOUNT = 1;

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

  const [addAmountHabitId, setAddAmountHabitId] = useState<string | null>(null);
  const [addAmountValue, setAddAmountValue] = useState<string>("");

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

  function handleToggle(habitId: string, next: boolean) {
    const logDate = today;
    if (next) {
      checkHabit.mutate({ habitId, logDate });
    } else {
      uncheckHabit.mutate({ habitId, logDate });
    }
  }

  function openAddAmount(habitId: string) {
    setAddAmountValue(String(DEFAULT_AMOUNT));
    setAddAmountHabitId(habitId);
  }

  function confirmAddAmount() {
    if (!addAmountHabitId) return;
    const parsed = parseFloat(addAmountValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setAddAmountHabitId(null);
      return;
    }
    checkHabit.mutate({
      habitId: addAmountHabitId,
      logDate: today,
      amount: parsed,
    });
    setAddAmountHabitId(null);
  }

  if (isLoading) {
    return (
      <Card className="bg-notion-surface border-notion-hairline rounded-xl border shadow-none">
        <CardContent className="text-body-sm text-notion-ink-muted flex items-center justify-center py-10">
          Loading…
        </CardContent>
      </Card>
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

  const addAmountHabit = addAmountHabitId
    ? habits.find((h) => h.id === addAmountHabitId) ?? null
    : null;
  const addAmountUnit = addAmountHabit?.unit ?? null;

  return (
    <Card
      aria-label="Today's habits"
      data-testid="today-habits-widget"
      className="bg-notion-surface border-notion-hairline rounded-xl border shadow-none"
    >
      <CardHeader className="flex-row items-baseline justify-between gap-2 px-6 pt-6 pb-2">
        <CardTitle className="text-heading-3 text-notion-ink">
          Today&apos;s habits
        </CardTitle>
        <span className="text-caption text-notion-ink-muted tabular-nums">
          {completedCount} of {dueToday.length} done
        </span>
      </CardHeader>

      <CardContent className="px-2 pt-2 pb-2">
        <ul className="flex flex-col">
          {dueToday.map(({ habit, done }) => {
            const isNegative = habit.habitType === "negative";
            const isQuantifiable = habit.target !== null;
            const progress = progressByHabit.get(habit.id);
            const elapsed = isNegative ? elapsedByHabit.get(habit.id) ?? null : null;

            return (
              <li
                key={habit.id}
                className="rounded-md flex items-center gap-3 px-3 py-2 transition-colors hover:bg-notion-surface-soft"
              >
                {isNegative ? (
                  <span
                    aria-hidden
                    className="border-notion-hairline-strong flex size-5 shrink-0 items-center justify-center rounded-sm border"
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
                  className={cn(
                    "min-w-0 flex-1 truncate text-body-sm transition-colors hover:text-notion-ink-muted",
                    done
                      ? "text-notion-ink-faint line-through"
                      : "text-notion-ink",
                  )}
                  aria-label={`View details for ${habit.name}`}
                >
                  {habit.name}
                </Link>

                {isQuantifiable ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-caption text-notion-ink-muted tabular-nums">
                      {progress?.current ?? 0} / {habit.target}{" "}
                      {habit.unit ?? ""}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openAddAmount(habit.id)}
                      aria-label={`Add amount for ${habit.name}`}
                      data-testid="habit-add-amount"
                      className="text-notion-ink-muted hover:text-notion-ink"
                    >
                      <Plus className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                ) : null}

                {isNegative && elapsed ? (
                  <span className="bg-notion-surface-soft text-notion-ink-muted shrink-0 rounded-full px-2 py-0.5 text-eyebrow">
                    {elapsed}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>

        <footer className="mt-2 flex justify-end border-t border-notion-hairline px-2 pt-3 pb-2">
          <Link
            href="/habits"
            className="text-caption text-notion-ink-muted hover:text-notion-ink transition-colors"
          >
            View all habits →
          </Link>
        </footer>
      </CardContent>

      <AlertDialog
        open={addAmountHabitId !== null}
        onOpenChange={(open) => {
          if (!open) setAddAmountHabitId(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {addAmountHabit
                ? `Add amount for ${addAmountHabit.name}`
                : "Add amount"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {addAmountHabit?.target !== null && addAmountHabit
                ? `Target: ${addAmountHabit.target}${addAmountUnit ? ` ${addAmountUnit}` : ""}`
                : "Enter the amount you completed today."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 px-0">
            <Label htmlFor="today-add-amount" className="sr-only">
              Amount
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="today-add-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={addAmountValue}
                onChange={(e) => setAddAmountValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmAddAmount();
                }}
                autoFocus
              />
              {addAmountUnit ? (
                <span className="text-body-sm text-notion-ink-muted">
                  {addAmountUnit}
                </span>
              ) : null}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAddAmountHabitId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmAddAmount}>
              Add
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
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
      className={cn(
        "flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors disabled:cursor-default",
        done
          ? "border-notion-primary bg-notion-primary"
          : "border-notion-hairline-strong bg-transparent",
      )}
    >
      {done ? (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="text-notion-on-primary size-3"
        >
          <polyline points="3.5 8.5 6.5 11.5 12.5 5.5" />
        </svg>
      ) : null}
    </button>
  );
}
