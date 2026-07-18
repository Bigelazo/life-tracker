import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Habits" };

export default function HabitsPage() {
  return (
    <section>
      <h1 className="mb-6 text-2xl">Habits</h1>
      <EmptyState
        slug="habits"
        title="No habits yet"
        description="Track boolean, quantifiable and negative habits with streaks — coming in the habits milestone."
      />
    </section>
  );
}
