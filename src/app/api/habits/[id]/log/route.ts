import { NextResponse } from "next/server";
import { db } from "@/db";
import { habitLogs, habits } from "@/db/schema";
import { serializeHabitLog } from "@/habits/serialize";
import { and, eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as { logDate?: string; amount?: number };

  if (!body.logDate || typeof body.logDate !== "string") {
    return NextResponse.json({ error: "logDate is required" }, { status: 400 });
  }

  const amount = typeof body.amount === "number" && body.amount > 0 ? body.amount : 1;

  const [habit] = await db
    .select({ target: habits.target })
    .from(habits)
    .where(eq(habits.id, id));

  if (!habit) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  const isQuantifiable = habit.target !== null;

  if (!isQuantifiable) {
    const [existing] = await db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, id), eq(habitLogs.logDate, body.logDate)))
      .limit(1);

    if (existing) {
      return NextResponse.json(serializeHabitLog(existing), { status: 200 });
    }
  }

  const [row] = await db
    .insert(habitLogs)
    .values({ habitId: id, logDate: body.logDate, amount })
    .returning();

  return NextResponse.json(serializeHabitLog(row), { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const logDate = searchParams.get("logDate");

  if (!logDate) {
    return NextResponse.json({ error: "logDate query parameter is required" }, { status: 400 });
  }

  await db
    .delete(habitLogs)
    .where(and(eq(habitLogs.habitId, id), eq(habitLogs.logDate, logDate)));

  return NextResponse.json({ success: true });
}