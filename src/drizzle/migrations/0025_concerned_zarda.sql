CREATE TABLE "it_license_renewals" (
	"id" varchar PRIMARY KEY NOT NULL,
	"license_id" varchar NOT NULL,
	"vendor_id" uuid NOT NULL,
	"license_key" text,
	"total_seats" integer DEFAULT 1 NOT NULL,
	"used_seats" integer DEFAULT 0 NOT NULL,
	"start_date" date,
	"end_date" date,
	"renewal_cost" numeric(14, 2),
	"renewal_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "it_licenses" DROP CONSTRAINT "it_licenses_vendor_id_vendors_id_fk";
--> statement-breakpoint
DROP INDEX "it_licenses_vendor_idx";--> statement-breakpoint
DROP INDEX "it_licenses_license_key_ci_unique";--> statement-breakpoint
ALTER TABLE "it_license_renewals" ADD CONSTRAINT "it_license_renewals_license_id_it_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."it_licenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_license_renewals" ADD CONSTRAINT "it_license_renewals_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "it_license_renewals_license_idx" ON "it_license_renewals" USING btree ("license_id");--> statement-breakpoint
CREATE INDEX "it_license_renewals_renewal_date_idx" ON "it_license_renewals" USING btree ("renewal_date");--> statement-breakpoint
CREATE UNIQUE INDEX "it_license_renewals_license_key_ci_unique" ON "it_license_renewals" USING btree (lower("license_key"));--> statement-breakpoint
ALTER TABLE "it_licenses" DROP COLUMN "vendor_id";--> statement-breakpoint
ALTER TABLE "it_licenses" DROP COLUMN "license_key";--> statement-breakpoint
ALTER TABLE "it_licenses" DROP COLUMN "total_seats";--> statement-breakpoint
ALTER TABLE "it_licenses" DROP COLUMN "used_seats";--> statement-breakpoint
ALTER TABLE "it_licenses" DROP COLUMN "start_date";--> statement-breakpoint
ALTER TABLE "it_licenses" DROP COLUMN "end_date";--> statement-breakpoint
ALTER TABLE "it_licenses" DROP COLUMN "renewal_date";--> statement-breakpoint
ALTER TABLE "it_licenses" DROP COLUMN "renewal_cost";--> statement-breakpoint
ALTER TABLE "it_licenses" DROP COLUMN "notes";