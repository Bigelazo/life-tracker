import type { Metadata } from "next";
import { SectionPage } from "@/components/section-page";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <SectionPage
      slug="today"
      title="Today"
      emptyStateTitle="Your day at a glance"
      emptyStateDescription="Habits due today, this month's money summary and your recent notes will live here."
    />
  );
}
