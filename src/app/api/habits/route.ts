import { NextResponse } from "next/server";
import { db } from "@/db";
import { habits } from "@/db/schema";
import { coerceFrequency, coerceHabitType } from "@/habits/domain";
import { serializeHabit } from "@/habits/serialize";
import { asc } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(habits)
    .orderBy(asc(habits.createdAt));

  return NextResponse.json(rows.map(serializeHabit));
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    description?: string;
    habitType?: unknown;
    frequency?: unknown;
    target?: number | null;
    unit?: string | null;
  };
  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const habitType = coerceHabitType(body.habitType);
  const frequency = coerceFrequency(body.frequency);

  const [row] = await db
    .insert(habits)
    .values({
      name: body.name.trim(),
      description: body.description?.trim() || null,
      habitType,
      frequency,
      target: body.target ?? null,
      unit: body.unit?.trim() || null,
    })
    .returning();

  return NextResponse.json(serializeHabit(row), { status: 201 });
}