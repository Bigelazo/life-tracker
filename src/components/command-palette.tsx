"use client";

import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "cmdk";
import { SECTIONS } from "@/lib/sections";
import { SectionIcon } from "@/components/section-icon";
import { signOut as signOutAction } from "@/auth/actions";
import {
  useCheckHabit,
  useHabitLogs,
  useHabits,
  useSettings,
} from "@/habits/hooks";
import { buildLogIndex, computeDueToday, todayDateString } from "@/habits/domain";

const NAV_ITEMS = SECTIONS.map((section) => ({
  id: section.slug,
  label: section.label,
  href: section.href,
  slug: section.slug,
}));

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [pendingHabitId, setPendingHabitId] = useState<string | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const { data: habits } = useHabits();
  const { data: logs } = useHabitLogs();
  const { data: settings } = useSettings();
  const checkHabit = useCheckHabit();

  const timezone = settings?.timezone ?? "UTC";

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

  const logIndex = useMemo(() => buildLogIndex(domainLogs), [domainLogs]);

  const dueToday = useMemo(
    () => computeDueToday(domainHabits, logIndex, timezone),
    [domainHabits, logIndex, timezone],
  );

  // Habits eligible for a one-keystroke check-off: positive (boolean or
  // quantifiable), due today, and not already done. Negative habits use a
  // different model (relapse) and don't get a check-off action.
  const checkOffHabits = useMemo(
    () =>
      dueToday.filter(
        (d) => d.habit.habitType !== "negative" && !d.done,
      ),
    [dueToday],
  );

  const allHabits = useMemo(
    () =>
      (habits ?? [])
        .filter((h) => !h.archived)
        .map((h) => ({ id: h.id, name: h.name })),
    [habits],
  );

  function handleSelect(href: string) {
    setOpen(false);
    router.push(href);
  }

  function handleCheckOff(habitId: string) {
    const habit = domainHabits.find((h) => h.id === habitId);
    if (!habit) return;
    setOpen(false);
    setPendingHabitId(habitId);
    const logDate = todayDateString(timezone);
    // For boolean habits the server treats an insert of amount 1 as a
    // check (idempotent). For quantifiable habits, adding 1 unit is the
    // consistent quick-action — the day becomes "done" only once the
    // cumulative amount reaches the target.
    const amount = habit.target !== null ? 1 : undefined;
    checkHabit.mutate(
      amount !== undefined ? { habitId, logDate, amount } : { habitId, logDate },
      { onSettled: () => setPendingHabitId(null) },
    );
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      contentClassName="bg-surface-2 border-hairline rounded-lg border shadow-2xl fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg"
      overlayClassName="bg-black/60 fixed inset-0"
    >
      <CommandInput
        placeholder="Type a command or search…"
        className="border-b-hairline text-ink placeholder:text-ink-tertiary pt-4 pb-3 px-4 outline-none focus-visible:outline-none"
      />
      <CommandList>
        <CommandEmpty className="text-ink-subtle py-6 text-center text-sm">
          No results found.
        </CommandEmpty>
        <CommandGroup heading="Navigate" className="[&_[cmdk-group-heading]]:text-ink-tertiary [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.id}
              value={item.id}
              onSelect={() => handleSelect(item.href)}
              className="text-ink aria-selected:bg-surface-3 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors"
            >
              <SectionIcon slug={item.slug} className="text-ink-subtle size-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        {allHabits.length > 0 ? (
          <>
            <CommandSeparator className="border-t-hairline" />
            <CommandGroup heading="Habits" className="[&_[cmdk-group-heading]]:text-ink-tertiary [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium">
              {checkOffHabits.length > 0 ? (
                checkOffHabits.map(({ habit }) => (
                  <CommandItem
                    key={`check-${habit.id}`}
                    value={`check off ${habit.name}`}
                    disabled={pendingHabitId === habit.id}
                    onSelect={() => handleCheckOff(habit.id)}
                    className="text-ink aria-selected:bg-surface-3 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors"
                  >
                    <CheckBadge />
                    <span className="flex-1">Check off {habit.name}</span>
                    {pendingHabitId === habit.id ? (
                      <span className="text-ink-tertiary text-xs">…</span>
                    ) : null}
                  </CommandItem>
                ))
              ) : null}
              {allHabits.map((h) => (
                <CommandItem
                  key={`go-${h.id}`}
                  value={`go to ${h.name}`}
                  onSelect={() => handleSelect(`/habits/${h.id}`)}
                  className="text-ink aria-selected:bg-surface-3 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors"
                >
                  <ArrowBadge />
                  <span className="flex-1">Go to {h.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
        <CommandSeparator className="border-t-hairline" />
        <CommandGroup heading="Actions" className="[&_[cmdk-group-heading]]:text-ink-tertiary [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium">
          <CommandItem
            value="sign-out"
            disabled={pending}
            onSelect={() => {
              setOpen(false);
              startTransition(async () => {
                await signOutAction();
                router.push("/login");
              });
            }}
            className="text-ink aria-selected:bg-surface-3 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors"
          >
            {pending ? "Signing out…" : "Sign out"}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function CheckBadge() {
  return (
    <span
      aria-hidden
      className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-primary bg-primary"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-2.5 text-white"
      >
        <polyline points="3.5 8.5 6.5 11.5 12.5 5.5" />
      </svg>
    </span>
  );
}

function ArrowBadge() {
  return (
    <span
      aria-hidden
      className="border-hairline-strong text-ink-subtle flex size-4 shrink-0 items-center justify-center rounded-sm border"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-2.5"
      >
        <polyline points="9 6 15 12 9 18" />
      </svg>
    </span>
  );
}
