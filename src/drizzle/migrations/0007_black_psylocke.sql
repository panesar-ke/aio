ALTER TABLE "grns_header" ADD COLUMN "store_id" uuid;--> statement-breakpoint
ALTER TABLE "material_issues_header" ADD COLUMN "store_id" uuid;--> statement-breakpoint
ALTER TABLE "grns_header" ADD CONSTRAINT "grns_header_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_issues_header" ADD CONSTRAINT "material_issues_header_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;