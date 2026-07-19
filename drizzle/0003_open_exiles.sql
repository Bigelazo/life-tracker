CREATE TABLE "habit_relapses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"habit_id" uuid NOT NULL,
	"relapsed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "habit_type" text DEFAULT 'positive' NOT NULL;--> statement-breakpoint
ALTER TABLE "habit_relapses" ADD CONSTRAINT "habit_relapses_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;