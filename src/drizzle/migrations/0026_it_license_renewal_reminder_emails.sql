CREATE TABLE "it_license_renewal_reminder_emails" (
	"id" varchar PRIMARY KEY NOT NULL,
	"license_id" varchar NOT NULL,
	"end_date" date NOT NULL,
	"days_before" integer NOT NULL,
	"resend_email_id" varchar(255),
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "it_license_renewal_reminder_emails" ADD CONSTRAINT "it_license_renewal_reminder_emails_license_id_it_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."it_licenses"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "it_license_renewal_reminder_emails_license_idx" ON "it_license_renewal_reminder_emails" USING btree ("license_id");
--> statement-breakpoint
CREATE INDEX "it_license_renewal_reminder_emails_end_date_idx" ON "it_license_renewal_reminder_emails" USING btree ("end_date");
--> statement-breakpoint
CREATE UNIQUE INDEX "it_license_renewal_reminder_emails_unique" ON "it_license_renewal_reminder_emails" USING btree ("license_id","end_date","days_before");

