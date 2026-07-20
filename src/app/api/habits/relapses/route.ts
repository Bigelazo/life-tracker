import { NextResponse } from "next/server";
import { db } from "@/db";
import { habitRelapses } from "@/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";

/**
 * `since` and `habitId` are both opt-in bounds. Omitting `since` returns
 * the full relapse history (the list view's `computeElapsedSince` needs
 * every row, since the latest relapse is what backs the counter). The
 * detail view passes only `habitId`.
 */
function parseSince(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sinceDate = parseSince(url.searchParams.get("since"));
  const habitId = url.searchParams.get("habitId");

  const conditions = [];
  if (sinceDate) conditions.push(gte(habitRelapses.relapsedAt, sinceDate));
  if (habitId) conditions.push(eq(habitRelapses.habitId, habitId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const baseQuery = db
    .select({
      id: habitRelapses.id,
      habitId: habitRelapses.habitId,
      relapsedAt: habitRelapses.relapsedAt,
    })
    .from(habitRelapses)
    .orderBy(desc(habitRelapses.relapsedAt));
  const rows = where ? await baseQuery.where(where) : await baseQuery;

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      habitId: r.habitId,
      relapsedAt: r.relapsedAt.toISOString(),
    })),
  );
}
