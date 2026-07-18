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
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
    })),
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string; description?: string };
  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const [row] = await db
    .insert(habits)
    .values({
      name: body.name.trim(),
      description: body.description?.trim() || null,
    })
    .returning();

  return NextResponse.json(
    {
      id: row.id,
      name: row.name,
      description: row.description,
      archived: row.archived,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
    { status: 201 },
  );
}
