import { sql } from "drizzle-orm";
import { check, integer, pgTable, text } from "drizzle-orm/pg-core";

/**
 * Single-row settings table — exactly one row (id = 1) holds the owner's
 * app-wide preferences. Later modules read timezone (habit day boundaries)
 * and currency (money display) from here.
 */
export const settings = pgTable(
  "settings",
  {
    id: integer("id").primaryKey().default(1),
    timezone: text("timezone").notNull().default("UTC"),
    currency: text("currency").notNull().default("EUR"),
  },
  (table) => [check("settings_singleton", sql`${table.id} = 1`)],
);
