CREATE TABLE "product_deactivation_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deactivation_date" timestamp DEFAULT now() NOT NULL,
	"threshold_days" integer NOT NULL,
	"total_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_deactivation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"last_used_date" date,
	"last_used_source" varchar NOT NULL,
	"balance_at_deactivation" numeric,
	"reactivated" boolean DEFAULT false NOT NULL,
	"reactivated_by" uuid,
	"reactivated_on" timestamp
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "created_on" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "exclude_from_auto_deactivation" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product_deactivation_items" ADD CONSTRAINT "product_deactivation_items_batch_id_product_deactivation_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."product_deactivation_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_deactivation_items" ADD CONSTRAINT "product_deactivation_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_deactivation_items" ADD CONSTRAINT "product_deactivation_items_reactivated_by_users_id_fk" FOREIGN KEY ("reactivated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;