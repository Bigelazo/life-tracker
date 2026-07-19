"use client";

import { useState } from "react";
import type { HabitFrequency, HabitType } from "@/habits/domain";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface HabitFormProps {
  onCreate: (data: {
    name: string;
    description: string | null;
    habitType: HabitType;
    frequency: HabitFrequency;
    target: number | null;
    unit: string | null;
  }) => void;
  loading?: boolean;
}

export function HabitForm({ onCreate, loading }: HabitFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [habitType, setHabitType] = useState<HabitType>("positive");
  const [freqType, setFreqType] = useState<"daily" | "times_per_week" | "fixed_weekdays">("daily");
  const [timesPerWeek, setTimesPerWeek] = useState(3);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isQuantifiable, setIsQuantifiable] = useState(false);
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");

  function handleSubmit() {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;

    let frequency: HabitFrequency;
    if (freqType === "times_per_week") {
      frequency = { type: "times_per_week", times: timesPerWeek };
    } else if (freqType === "fixed_weekdays") {
      frequency = { type: "fixed_weekdays", days: selectedDays };
    } else {
      frequency = { type: "daily" };
    }

    const targetNum = isQuantifiable ? parseFloat(target) || null : null;
    const unitVal = isQuantifiable ? unit.trim() || null : null;

    onCreate({
      name: trimmed,
      description: desc.trim() || null,
      habitType,
      frequency,
      target: targetNum,
      unit: unitVal,
    });

    setName("");
    setDesc("");
    setHabitType("positive");
    setFreqType("daily");
    setTimesPerWeek(3);
    setSelectedDays([1, 2, 3, 4, 5]);
    setIsQuantifiable(false);
    setTarget("");
    setUnit("");
    setOpen(false);
  }

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-hairline hover:bg-surface-2 rounded-lg flex w-full items-center justify-center border border-dashed p-4 text-[14px] leading-[1.5] text-[#8a8f98] transition-colors"
      >
        + New habit
      </button>
    );
  }

  return (
    <div className="border-hairline bg-surface-1 rounded-lg flex flex-col gap-3 border p-4">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setName("");
            setDesc("");
            setOpen(false);
          }
        }}
        className="bg-canvas border-hairline rounded-md w-full border px-3 py-1.5 text-[14px] leading-[1.5] text-[#f7f8f8] outline-none placeholder:text-[#62666d] focus:border-primary-focus"
        placeholder="Habit name"
        autoFocus
      />
      <input
        type="text"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") {
            setName("");
            setDesc("");
            setOpen(false);
          }
        }}
        className="bg-canvas border-hairline rounded-md w-full border px-3 py-1.5 text-[14px] leading-[1.5] text-[#f7f8f8] outline-none placeholder:text-[#62666d] focus:border-primary-focus"
        placeholder="Description (optional)"
      />

      <div className="flex flex-col gap-2">
        <label className="text-[12px] leading-[1.3] font-medium text-[#8a8f98]">Type</label>
        <div className="flex gap-1">
          {(["positive", "negative"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setHabitType(type);
                if (type === "negative") {
                  setIsQuantifiable(false);
                  setTarget("");
                  setUnit("");
                }
              }}
              className="rounded-md px-3 py-1.5 text-[12px] leading-[1.3] font-medium transition-colors border-hairline border"
              style={{
                borderColor: habitType === type ? "#5e6ad2" : "#34343a",
                color: habitType === type ? "#f7f8f8" : "#8a8f98",
              }}
            >
              {type === "positive" ? "Build" : "Quit"}
            </button>
          ))}
        </div>
      </div>

      {habitType === "positive" && (
        <div className="flex flex-col gap-2">
          <label className="text-[12px] leading-[1.3] font-medium text-[#8a8f98]">Frequency</label>
          <div className="flex gap-1">
            {(["daily", "times_per_week", "fixed_weekdays"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFreqType(type)}
                className="border-hairline rounded-md px-2.5 py-1 text-[12px] leading-[1.3] font-medium transition-colors"
                style={{
                  borderColor: freqType === type ? "#5e6ad2" : "#34343a",
                  color: freqType === type ? "#f7f8f8" : "#8a8f98",
                }}
              >
                {type === "daily" ? "Daily" : type === "times_per_week" ? "N / week" : "Weekdays"}
              </button>
            ))}
          </div>

          {freqType === "times_per_week" && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={timesPerWeek}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (v >= 1 && v <= 6) setTimesPerWeek(v);
                }}
                className="bg-canvas border-hairline rounded-md w-16 border px-2 py-1 text-[13px] leading-[1.5] text-[#f7f8f8] outline-none focus:border-primary-focus"
                min={1}
                max={6}
              />
              <span className="text-[12px] leading-[1.3] text-[#8a8f98]">times per week</span>
            </div>
          )}

          {freqType === "fixed_weekdays" && (
            <div className="flex gap-1">
              {WEEKDAYS.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className="rounded-md px-2 py-1 text-[11px] leading-[1.3] font-medium transition-colors border"
                  style={{
                    borderColor: selectedDays.includes(i) ? "#5e6ad2" : "#34343a",
                    color: selectedDays.includes(i) ? "#f7f8f8" : "#8a8f98",
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {habitType === "positive" && (
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-[12px] leading-[1.3] font-medium text-[#8a8f98] cursor-pointer">
            <input
              type="checkbox"
              checked={isQuantifiable}
              onChange={(e) => setIsQuantifiable(e.target.checked)}
              className="size-3.5 rounded-sm accent-[#5e6ad2]"
            />
            Quantifiable habit
          </label>

          {isQuantifiable && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="bg-canvas border-hairline rounded-md w-24 border px-2 py-1 text-[13px] leading-[1.5] text-[#f7f8f8] outline-none placeholder:text-[#62666d] focus:border-primary-focus"
                placeholder="Target"
                min="0"
                step="any"
              />
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="bg-canvas border-hairline rounded-md w-20 border px-2 py-1 text-[13px] leading-[1.5] text-[#f7f8f8] outline-none placeholder:text-[#62666d] focus:border-primary-focus"
                placeholder="Unit"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || name.trim().length === 0}
          className="bg-primary hover:bg-primary-hover rounded-md px-3 py-1 text-[14px] font-medium leading-[1.2] text-white transition-colors disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create"}
        </button>
        <button
          type="button"
          onClick={() => {
            setName("");
            setDesc("");
            setOpen(false);
          }}
          className="border-hairline bg-surface-1 rounded-md border px-3 py-1 text-[14px] font-medium leading-[1.2] text-[#f7f8f8] transition-colors hover:bg-surface-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
