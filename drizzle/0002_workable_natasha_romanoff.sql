ALTER TABLE "habit_logs" DROP CONSTRAINT "habit_logs_date_unique";--> statement-breakpoint
ALTER TABLE "habit_logs" ADD COLUMN "amount" real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "frequency" jsonb DEFAULT '{"type":"daily"}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "target" real;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "unit" text;