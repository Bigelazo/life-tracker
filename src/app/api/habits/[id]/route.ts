import { NextResponse } from "next/server";
import { db } from "@/db";
import { habits } from "@/db/schema";
import { coerceFrequency, coerceHabitType } from "@/habits/domain";
import { serializeHabit } from "@/habits/serialize";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    description?: string | null;
    archived?: boolean;
    habitType?: unknown;
    frequency?: unknown;
    target?: number | null;
    unit?: string | null;
  };

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.description !== undefined) data.description = body.description?.trim() || null;
  if (body.archived !== undefined) data.archived = body.archived;
  if (body.habitType !== undefined) data.habitType = coerceHabitType(body.habitType);
  if (body.frequency !== undefined) data.frequency = coerceFrequency(body.frequency);
  if (body.target !== undefined) data.target = body.target;
  if (body.unit !== undefined) data.unit = body.unit?.trim() || null;

  const [row] = await db
    .update(habits)
    .set(data)
    .where(eq(habits.id, id))
    .returning();

  if (!row) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  return NextResponse.json(serializeHabit(row));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [row] = await db
    .update(habits)
    .set({ archived: true, updatedAt: new Date() })
    .where(eq(habits.id, id))
    .returning();

  if (!row) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  return NextResponse.json(serializeHabit(row));
}