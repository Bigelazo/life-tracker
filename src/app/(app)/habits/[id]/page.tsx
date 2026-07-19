import type { Metadata } from "next";
import { HabitDetail } from "./habit-detail";

export const metadata: Metadata = { title: "Habit" };

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HabitDetail habitId={id} />;
}
