import { NextResponse } from "next/server";
import { db } from "@/db";
import { habitLogs } from "@/db/schema";
import { serializeHabitLog } from "@/habits/serialize";
import { and, asc, eq, gte } from "drizzle-orm";

/**
 * `since` and `habitId` are both opt-in bounds. Omitting `since` returns
 * the full history (used by the detail view, which needs every row for
 * `computeYearHeatmap` and `computeBestStreak`). Omitting `habitId`
 * returns rows for every habit. The list view passes `since` to keep its
 * payload bounded; nothing else should rely on a server-side default.
 */
function parseSince(value: string | null): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sinceParam = parseSince(url.searchParams.get("since"));
  const habitId = url.searchParams.get("habitId");

  const conditions = [];
  if (sinceParam) conditions.push(gte(habitLogs.logDate, sinceParam));
  if (habitId) conditions.push(eq(habitLogs.habitId, habitId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const baseQuery = db
    .select()
    .from(habitLogs)
    .orderBy(asc(habitLogs.logDate));
  const rows = where ? await baseQuery.where(where) : await baseQuery;

  return NextResponse.json(rows.map(serializeHabitLog));
}