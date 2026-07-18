"use client";

import { useState } from "react";

interface HabitFormProps {
  onCreate: (name: string, description: string | null) => void;
  loading?: boolean;
}

export function HabitForm({ onCreate, loading }: HabitFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  function handleSubmit() {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    onCreate(trimmed, desc.trim() || null);
    setName("");
    setDesc("");
    setOpen(false);
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
          if (e.key === "Enter") handleSubmit();
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
