import { NextResponse } from "next/server";
import { db } from "@/db";
import { habits } from "@/db/schema";
import { coerceFrequency, coerceHabitType } from "@/habits/domain";
import { asc } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(habits)
    .orderBy(asc(habits.createdAt));

  return NextResponse.json(
    rows.map((h) => ({
      id: h.id,
      name: h.name,
      description: h.description,
      archived: h.archived,
      habitType: h.habitType,
      frequency: h.frequency,
      target: h.target,
      unit: h.unit,
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
    })),
  );
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

  return NextResponse.json(
    {
      id: row.id,
      name: row.name,
      description: row.description,
      archived: row.archived,
      habitType: row.habitType,
      frequency: row.frequency,
      target: row.target,
      unit: row.unit,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
    { status: 201 },
  );
}

