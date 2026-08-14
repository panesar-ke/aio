CREATE TYPE "public"."sale_order_status" AS ENUM('draft', 'fulfilled', 'partially fulfilled', 'cancelled');--> statement-breakpoint
ALTER TABLE "sales_orders_header" ADD COLUMN "currency" varchar(3) DEFAULT 'KES' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales_orders_header" ADD COLUMN "conversion_rate" numeric DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales_orders_header" ADD COLUMN "total_amount_in_local_currency" numeric DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales_orders_header" ADD COLUMN "sale_order_status" "sale_order_status" DEFAULT 'fulfilled' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales_orders_header" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sales_orders_header" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "product_deactivation_batches" ADD COLUMN "trigger_request_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "sales_orders_header_sale_order_no_idx" ON "sales_orders_header" USING btree ("sale_order_no");--> statement-breakpoint
CREATE INDEX "sales_orders_header_sales_rep_date_idx" ON "sales_orders_header" USING btree ("sales_rep_id","date_raised");--> statement-breakpoint
CREATE INDEX "sales_orders_header_account_date_order_no_idx" ON "sales_orders_header" USING btree ("account_id","date_raised","sale_order_no");--> statement-breakpoint
CREATE UNIQUE INDEX "product_deactivation_batches_trigger_request_id_idx" ON "product_deactivation_batches" USING btree ("trigger_request_id") WHERE "product_deactivation_batches"."trigger_request_id" is not null;