"use client";

import { useMemo } from "react";
import type { HeatmapDay, DayStatus } from "@/habits/domain";

const STATUS_META: Record<
  DayStatus,
  { color?: string; label: string; border?: string }
> = {
  done: { color: "var(--color-primary)", label: "Done" },
  missed: { color: "var(--color-hairline-strong)", label: "Missed" },
  "not-due": {
    color: "var(--color-surface-1)",
    label: "Not due",
    border: "var(--color-hairline)",
  },
  relapse: { color: "var(--color-ink-tertiary)", label: "Relapse" },
  "before-creation": { label: "Before creation" },
};

type CellStatus = DayStatus | "out-of-year";

const OUT_OF_YEAR_META = {
  color: "transparent",
  border: "1px dashed var(--color-hairline)",
  label: "Not in year",
} as const;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + n);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function getWeekday(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function monthIndex(dateStr: string): number {
  return Number(dateStr.split("-")[1]) - 1;
}

const PADDING_STATUS = "out-of-year" as const;

export function YearHeatmap({ days }: { days: HeatmapDay[] }) {
  const { weeks, monthMarker } = useMemo(() => {
    if (days.length === 0) {
      return {
        weeks: [] as { date: string; status: CellStatus }[][],
        monthMarker: [] as { weekIndex: number; label: string }[],
      };
    }

    const firstDate = days[0]!.date;
    const mondayOffset = (getWeekday(firstDate) + 6) % 7;
    const padded: { date: string; status: CellStatus }[] = [];
    for (let i = mondayOffset - 1; i >= 0; i--) {
      padded.push({
        date: addDays(firstDate, -i - 1),
        status: PADDING_STATUS,
      });
    }
    const all = [...padded, ...days];

    const weekList: { date: string; status: CellStatus }[][] = [];
    for (let i = 0; i < all.length; i += 7) {
      weekList.push(all.slice(i, i + 7));
    }

    const markers: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;
    weekList.forEach((week, idx) => {
      const firstDayOfWeek = week[0]!;
      const m = monthIndex(firstDayOfWeek.date);
      if (m !== lastMonth) {
        markers.push({ weekIndex: idx, label: MONTH_LABELS[m]! });
        lastMonth = m;
      }
    });

    return { weeks: weekList, monthMarker: markers };
  }, [days]);

  if (weeks.length === 0) return null;

  return (
    <div className="border-hairline bg-surface-1 rounded-lg border p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 shrink-0" />
          <div className="flex gap-[3px]">
            {weeks.map((_week, i) => {
              const marker = monthMarker.find((m) => m.weekIndex === i);
              return (
                <div
                  key={i}
                  className="text-ink-tertiary w-[10px] text-[10px] leading-[1.2]"
                >
                  {marker ? marker.label : ""}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex w-8 shrink-0 flex-col gap-[3px] pt-0">
            {WEEKDAYS.map((label, i) => (
              <div
                key={label}
                className="text-ink-tertiary h-[10px] text-[10px] leading-[1.2]"
                style={{ visibility: i % 2 === 0 ? "visible" : "hidden" }}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="flex gap-[3px] overflow-x-auto">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
                {week.map((day) => {
                  const meta =
                    day.status === "out-of-year"
                      ? OUT_OF_YEAR_META
                      : STATUS_META[day.status];
                  return (
                    <div
                      key={day.date}
                      className="size-[10px] shrink-0 rounded-[2px]"
                      style={{
                        backgroundColor: meta.color,
                        border: meta.border ?? "none",
                      }}
                      title={`${day.date}: ${meta.label}`}
                      aria-label={`${day.date}: ${meta.label}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] leading-[1.3] text-ink-subtle">
          {(
            [
              "done",
              "missed",
              "not-due",
              "relapse",
              "before-creation",
              "out-of-year",
            ] as CellStatus[]
          ).map((status) => {
            const meta =
              status === "out-of-year" ? OUT_OF_YEAR_META : STATUS_META[status];
            return (
              <span key={status} className="flex items-center gap-1.5">
                <span
                  className="size-[10px] rounded-[2px]"
                  style={{
                    backgroundColor: meta.color,
                    border: meta.border ?? "none",
                  }}
                />
                {meta.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
