CREATE TYPE "public"."job_status" AS ENUM('on hold', 'in progress', 'completed');--> statement-breakpoint
ALTER TABLE "cnc_job_tracker" ADD COLUMN "status" "job_status" DEFAULT 'in progress' NOT NULL;