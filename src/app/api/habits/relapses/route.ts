import { NextResponse } from "next/server";
import { db } from "@/db";
import { habitRelapses } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select({
      id: habitRelapses.id,
      habitId: habitRelapses.habitId,
      relapsedAt: habitRelapses.relapsedAt,
    })
    .from(habitRelapses)
    .orderBy(desc(habitRelapses.relapsedAt));

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      habitId: r.habitId,
      relapsedAt: r.relapsedAt.toISOString(),
    })),
  );
}
