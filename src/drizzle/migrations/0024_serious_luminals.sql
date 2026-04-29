CREATE TYPE "public"."license_status" AS ENUM('active', 'expired', 'suspended', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."license_type" AS ENUM('subscription', 'perpetual');--> statement-breakpoint
CREATE TABLE "it_licenses" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"software_name" varchar(255) NOT NULL,
	"vendor_id" uuid NOT NULL,
	"license_key" text,
	"license_type" "license_type" DEFAULT 'subscription' NOT NULL,
	"total_seats" integer DEFAULT 1 NOT NULL,
	"used_seats" integer DEFAULT 0 NOT NULL,
	"start_date" date,
	"end_date" date,
	"renewal_date" date,
	"renewal_cost" numeric(14, 2),
	"status" "license_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "it_licenses" ADD CONSTRAINT "it_licenses_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "it_licenses_name_idx" ON "it_licenses" USING btree ("name");--> statement-breakpoint
CREATE INDEX "it_licenses_software_name_idx" ON "it_licenses" USING btree ("software_name");--> statement-breakpoint
CREATE INDEX "it_licenses_vendor_idx" ON "it_licenses" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "it_licenses_license_type_idx" ON "it_licenses" USING btree ("license_type");--> statement-breakpoint
CREATE INDEX "it_licenses_status_idx" ON "it_licenses" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "it_licenses_license_key_ci_unique" ON "it_licenses" USING btree (lower("license_key"));