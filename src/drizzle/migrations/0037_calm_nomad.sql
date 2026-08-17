ALTER TABLE "users" ADD COLUMN "password_policy_version" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_changed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_policy_exempt_until" timestamp with time zone;