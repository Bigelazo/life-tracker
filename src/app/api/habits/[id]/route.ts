import { NextResponse } from "next/server";
import { db } from "@/db";
import { habits } from "@/db/schema";
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
    frequency?: unknown;
    target?: number | null;
    unit?: string | null;
  };

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.description !== undefined) data.description = body.description?.trim() || null;
  if (body.archived !== undefined) data.archived = body.archived;
  if (body.frequency !== undefined) data.frequency = validFrequency(body.frequency);
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

  return NextResponse.json({
    id: row.id,
    name: row.name,
    description: row.description,
    archived: row.archived,
    frequency: row.frequency,
    target: row.target,
    unit: row.unit,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
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

  return NextResponse.json({
    id: row.id,
    name: row.name,
    description: row.description,
    archived: row.archived,
    frequency: row.frequency,
    target: row.target,
    unit: row.unit,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function validFrequency(f: unknown) {
  if (!f || typeof f !== "object") return { type: "daily" };
  const obj = f as Record<string, unknown>;
  if (obj.type === "times_per_week") {
    const times = Number(obj.times);
    if (times >= 1 && times <= 6 && Number.isInteger(times)) {
      return { type: "times_per_week", times };
    }
    return { type: "daily" };
  }
  if (obj.type === "fixed_weekdays") {
    if (Array.isArray(obj.days) && obj.days.length > 0 && obj.days.every((d: unknown) => typeof d === "number" && d >= 0 && d <= 6 && Number.isInteger(d))) {
      return { type: "fixed_weekdays", days: obj.days as number[] };
    }
    return { type: "daily" };
  }
  return { type: "daily" };
}
