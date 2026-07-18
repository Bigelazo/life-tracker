import { NextResponse } from "next/server";
import { db } from "@/db";
import { habitLogs } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as { logDate?: string };

  if (!body.logDate || typeof body.logDate !== "string") {
    return NextResponse.json({ error: "logDate is required" }, { status: 400 });
  }

  const [row] = await db
    .insert(habitLogs)
    .values({ habitId: id, logDate: body.logDate })
    .onConflictDoNothing()
    .returning();

  return NextResponse.json(
    {
      id: row?.id ?? null,
      habitId: id,
      logDate: body.logDate,
      createdAt: row?.createdAt?.toISOString() ?? null,
    },
    { status: 201 },
  );
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
