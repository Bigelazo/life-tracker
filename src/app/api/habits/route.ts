import { NextResponse } from "next/server";
import { db } from "@/db";
import { habits } from "@/db/schema";
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
    frequency?: unknown;
    target?: number | null;
    unit?: string | null;
  };
  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const frequency = validFrequency(body.frequency);

  const [row] = await db
    .insert(habits)
    .values({
      name: body.name.trim(),
      description: body.description?.trim() || null,
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
      frequency: row.frequency,
      target: row.target,
      unit: row.unit,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
    { status: 201 },
  );
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
