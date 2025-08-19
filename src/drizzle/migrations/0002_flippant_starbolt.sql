DROP TABLE "cache" CASCADE;--> statement-breakpoint
DROP TABLE "cache_locks" CASCADE;--> statement-breakpoint
DROP TABLE "failed_jobs" CASCADE;--> statement-breakpoint
DROP TABLE "job_batches" CASCADE;--> statement-breakpoint
DROP TABLE "jobs" CASCADE;--> statement-breakpoint
DROP TABLE "migrations" CASCADE;--> statement-breakpoint
DROP TABLE "password_reset_tokens" CASCADE;--> statement-breakpoint
DROP TABLE "personal_access_tokens" CASCADE;--> statement-breakpoint
ALTER TABLE "mrq_headers" ADD COLUMN "file_url" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "event_id" text;--> statement-breakpoint
ALTER TABLE "orders_header" ADD COLUMN "file_url" text;