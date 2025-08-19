CREATE TABLE "auto_order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"reorder_level" numeric NOT NULL,
	"reorder_qty" numeric NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auto_order_items" ADD CONSTRAINT "auto_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_order_items" ADD CONSTRAINT "auto_order_items_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;