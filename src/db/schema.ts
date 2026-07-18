import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

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

export const habits = pgTable("habits", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  archived: boolean("archived").notNull().default(false),
  frequency: jsonb("frequency").notNull().default({ type: "daily" }),
  target: real("target"),
  unit: text("unit"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const habitLogs = pgTable(
  "habit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    habitId: uuid("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    logDate: date("log_date").notNull(),
    amount: real("amount").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
);

export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type HabitLog = typeof habitLogs.$inferSelect;
export type NewHabitLog = typeof habitLogs.$inferInsert;
