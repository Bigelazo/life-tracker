"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CheckIcon } from "./check-icon";

interface HabitCardProps {
  id: string;
  name: string;
  description: string | null;
  streak: number;
  done: boolean;
  target: number | null;
  unit: string | null;
  currentAmount: number;
  onToggle: (done: boolean) => void;
  onArchive: () => void;
  onRename: (name: string, description: string | null) => void;
  onAddAmount: (amount: number) => void;
}

export function HabitCard({
  name,
  description,
  streak,
  done,
  target,
  unit,
  currentAmount,
  onToggle,
  onArchive,
  onRename,
  onAddAmount,
}: HabitCardProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editDesc, setEditDesc] = useState(description ?? "");
  const [addingAmount, setAddingAmount] = useState(false);
  const [amountValue, setAmountValue] = useState("");

  const isQuantifiable = target !== null;

  function handleSave() {
    const trimmed = editName.trim();
    if (trimmed.length === 0) return;
    onRename(trimmed, editDesc.trim() || null);
    setEditing(false);
  }

  function handleCancel() {
    setEditName(name);
    setEditDesc(description ?? "");
    setEditing(false);
  }

  function handleAddAmount() {
    const parsed = parseFloat(amountValue);
    if (parsed > 0) {
      onAddAmount(parsed);
      setAmountValue("");
      setAddingAmount(false);
    }
  }

  const progressRatio = isQuantifiable && target! > 0
    ? Math.min(currentAmount / target!, 1)
    : 0;

  return (
    <div className="border-hairline bg-surface-1 rounded-lg flex items-start gap-3 border p-4 transition-colors group">
      {isQuantifiable ? (
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setAddingAmount(!addingAmount)}
            className="mt-0 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors"
            style={{
              borderColor: done ? "#5e6ad2" : "#34343a",
              backgroundColor: done ? "#5e6ad2" : "transparent",
            }}
            aria-label={done ? `Mark ${name} as incomplete` : `Add amount for ${name}`}
          >
            {done && <CheckIcon className="size-3 text-white" />}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onToggle(!done)}
          className="mt-0 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors"
          style={{
            borderColor: done ? "#5e6ad2" : "#34343a",
            backgroundColor: done ? "#5e6ad2" : "transparent",
          }}
          aria-label={done ? `Unmark ${name} as done` : `Mark ${name} as done`}
        >
          {done && <CheckIcon className="size-3 text-white" />}
        </button>
      )}

      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              className="bg-canvas border-hairline rounded-md w-full border px-3 py-1.5 text-[14px] leading-[1.5] text-[#f7f8f8] outline-none focus:border-primary-focus"
              placeholder="Habit name"
              autoFocus
            />
            <input
              type="text"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              className="bg-canvas border-hairline rounded-md w-full border px-3 py-1.5 text-[14px] leading-[1.5] text-[#f7f8f8] outline-none focus:border-primary-focus"
              placeholder="Description (optional)"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="bg-primary hover:bg-primary-hover rounded-md px-3 py-1 text-[14px] font-medium leading-[1.2] text-white transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="border-hairline bg-surface-1 rounded-md border px-3 py-1 text-[14px] font-medium leading-[1.2] text-[#f7f8f8] transition-colors hover:bg-surface-2"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span
                className={`text-[16px] leading-[1.5] ${
                  done ? "text-[#8a8f98] line-through" : "text-[#f7f8f8]"
                }`}
              >
                {name}
              </span>
              {streak > 1 && (
                <span className="bg-surface-2 text-[#8a8f98] rounded-full px-2 py-0.5 text-[11px] leading-[1.4] font-medium">
                  {streak} days
                </span>
              )}
            </div>
            {description && (
              <p
                className={`mt-0.5 text-[14px] leading-[1.5] ${
                  done ? "text-[#62666d] line-through" : "text-[#8a8f98]"
                }`}
              >
                {description}
              </p>
            )}

            {isQuantifiable && (
              <div className="mt-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="bg-surface-2 rounded-full h-1.5 flex-1 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: "#5e6ad2" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressRatio * 100}%` }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    />
                  </div>
                  <span className="text-[11px] leading-[1.4] text-[#8a8f98] shrink-0">
                    {currentAmount} / {target} {unit ?? ""}
                  </span>
                </div>

                {addingAmount && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={amountValue}
                      onChange={(e) => setAmountValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddAmount();
                        if (e.key === "Escape") {
                          setAmountValue("");
                          setAddingAmount(false);
                        }
                      }}
                      className="bg-canvas border-hairline rounded-md w-20 border px-2 py-1 text-[13px] leading-[1.5] text-[#f7f8f8] outline-none focus:border-primary-focus"
                      placeholder="Amount"
                      autoFocus
                      min="0"
                      step="any"
                    />
                    <button
                      type="button"
                      onClick={handleAddAmount}
                      className="bg-primary hover:bg-primary-hover rounded-md px-2 py-1 text-[12px] font-medium leading-[1.2] text-white transition-colors"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAmountValue("");
                        setAddingAmount(false);
                      }}
                      className="text-[#8a8f98] hover:text-[#f7f8f8] text-[12px] leading-[1.2] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => {
                  setEditName(name);
                  setEditDesc(description ?? "");
                  setEditing(true);
                }}
                className="text-[#8a8f98] hover:text-[#f7f8f8] text-[13px] leading-[1.3] transition-colors"
              >
                Edit
              </button>
              {isQuantifiable && done && (
                <button
                  type="button"
                  onClick={() => onToggle(false)}
                  className="text-[#8a8f98] hover:text-[#f7f8f8] text-[13px] leading-[1.3] transition-colors"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={onArchive}
                className="text-[#62666d] hover:text-[#f7f8f8] text-[13px] leading-[1.3] transition-colors"
              >
                Archive
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
