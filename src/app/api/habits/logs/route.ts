import { NextResponse } from "next/server";
import { db } from "@/db";
import { habitLogs } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select({
      id: habitLogs.id,
      habitId: habitLogs.habitId,
      logDate: habitLogs.logDate,
      amount: habitLogs.amount,
      createdAt: habitLogs.createdAt,
    })
    .from(habitLogs)
    .orderBy(asc(habitLogs.logDate));

  return NextResponse.json(
    rows.map((l) => ({
      id: l.id,
      habitId: l.habitId,
      logDate: l.logDate,
      amount: l.amount,
      createdAt: l.createdAt.toISOString(),
    })),
  );
}
