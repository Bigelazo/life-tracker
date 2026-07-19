import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { YearHeatmap } from "@/components/year-heatmap";
import type { HeatmapDay } from "@/habits/domain";

function makeDays(
  year: number,
  map: Record<string, HeatmapDay["status"]>,
): HeatmapDay[] {
  const total = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
  const days: HeatmapDay[] = [];
  for (let i = 0; i < total; i++) {
    const d = new Date(year, 0, 1);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${day}`;
    days.push({ date: dateStr, status: map[dateStr] ?? "not-due" });
  }
  return days;
}

describe("YearHeatmap", () => {
  it("renders the legend", () => {
    render(<YearHeatmap days={makeDays(2026, {})} />);
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Missed")).toBeInTheDocument();
    expect(screen.getByText("Not due")).toBeInTheDocument();
    expect(screen.getByText("Relapse")).toBeInTheDocument();
    expect(screen.getByText("Before creation")).toBeInTheDocument();
    expect(screen.getByText("Not in year")).toBeInTheDocument();
  });

  it("renders at least one cell per day in the year (plus padding to align to Monday)", () => {
    render(<YearHeatmap days={makeDays(2026, {})} />);
    const cells = screen.getAllByLabelText(/^\d{4}-\d{2}-\d{2}: /);
    expect(cells.length).toBeGreaterThanOrEqual(365);
  });

  it("uses accessible labels with the day status", () => {
    render(
      <YearHeatmap
        days={makeDays(2026, {
          "2026-03-15": "done",
          "2026-03-16": "missed",
        })}
      />,
    );
    expect(
      screen.getByLabelText("2026-03-15: Done"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("2026-03-16: Missed"),
    ).toBeInTheDocument();
  });
});
