import type { Metadata } from "next";
import { SectionPage } from "@/components/section-page";

export const metadata: Metadata = { title: "Habits" };

export default function HabitsPage() {
  return (
    <SectionPage
      slug="habits"
      title="Habits"
      emptyStateTitle="No habits yet"
      emptyStateDescription="Track boolean, quantifiable and negative habits with streaks — coming in the habits milestone."
    />
  );
}
