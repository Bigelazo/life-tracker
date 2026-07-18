import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <section>
      <h1 className="mb-6 text-2xl">Today</h1>
      <EmptyState
        slug="today"
        title="Your day at a glance"
        description="Habits due today, this month's money summary and your recent notes will live here."
      />
    </section>
  );
}
