import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const [row] = await db.select().from(settings).where(eq(settings.id, 1));
  return NextResponse.json({
    timezone: row?.timezone ?? "UTC",
    currency: row?.currency ?? "EUR",
  });
}
