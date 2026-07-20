import { NextResponse } from "next/server";
import { db } from "@/db";
import { habitRelapses } from "@/db/schema";
import { serializeRelapse } from "@/habits/serialize";
import { desc, eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const rows = await db
    .select()
    .from(habitRelapses)
    .where(eq(habitRelapses.habitId, id))
    .orderBy(desc(habitRelapses.relapsedAt));

  return NextResponse.json(rows.map(serializeRelapse));
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

  return NextResponse.json(serializeRelapse(row), { status: 201 });
}