import { NextResponse } from "next/server";
import { db } from "@/db";
import { habitRelapses } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const rows = await db
    .select({
      id: habitRelapses.id,
      habitId: habitRelapses.habitId,
      relapsedAt: habitRelapses.relapsedAt,
    })
    .from(habitRelapses)
    .where(eq(habitRelapses.habitId, id))
    .orderBy(desc(habitRelapses.relapsedAt));

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      habitId: r.habitId,
      relapsedAt: r.relapsedAt.toISOString(),
    })),
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const body = (await request.json().catch(() => ({}))) as {
    relapsedAt?: string;
  };

  const relapsedAt = body.relapsedAt ? new Date(body.relapsedAt) : new Date();

  const [row] = await db
    .insert(habitRelapses)
    .values({ habitId: id, relapsedAt })
    .returning();

  return NextResponse.json(
    {
      id: row.id,
      habitId: row.habitId,
      relapsedAt: row.relapsedAt.toISOString(),
    },
    { status: 201 },
  );
}
