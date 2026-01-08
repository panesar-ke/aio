CREATE TABLE "cnc_job_tracker" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_card_no" varchar(6) NOT NULL,
	"job_description" varchar(255) NOT NULL,
	"job_type" varchar(255) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"time_spent" numeric DEFAULT '0' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cnc_job_tracker" ADD CONSTRAINT "cnc_job_tracker_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_card_no_idx" ON "cnc_job_tracker" USING btree ("job_card_no");--> statement-breakpoint
CREATE INDEX "job_description_idx" ON "cnc_job_tracker" USING btree ("job_description");--> statement-breakpoint
CREATE INDEX "job_type_idx" ON "cnc_job_tracker" USING btree ("job_type");--> statement-breakpoint
CREATE INDEX "start_date_idx" ON "cnc_job_tracker" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "end_date_idx" ON "cnc_job_tracker" USING btree ("end_date");