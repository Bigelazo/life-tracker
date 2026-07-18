import type { Metadata } from "next";
import { HabitsContent } from "./habits-content";

export const metadata: Metadata = { title: "Habits" };

export default function HabitsPage() {
  return (
    <section>
      <h1 className="mb-6 text-[28px] leading-[1.2] font-semibold tracking-[-0.6px]">
        Habits
      </h1>
      <HabitsContent />
    </section>
  );
}
