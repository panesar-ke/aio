ALTER TABLE "it_expenses" ALTER COLUMN "asset_id" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "it_expenses" ALTER COLUMN "license_id" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "it_expenses" ADD CONSTRAINT "it_expenses_asset_id_it_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."it_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_expenses" ADD CONSTRAINT "it_expenses_license_id_it_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."it_licenses"("id") ON DELETE no action ON UPDATE no action;