ALTER TYPE "public"."stockMovementTypeEnum" ADD VALUE 'TRANSFER_IN';--> statement-breakpoint
CREATE TABLE "material_transfer_header" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_date" timestamp NOT NULL,
	"from_store_id" uuid NOT NULL,
	"to_store_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials_transfer_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"header_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"transferred_qty" numeric(10, 2) NOT NULL,
	"stock_balance" numeric(10, 2) NOT NULL,
	"remarks" text
);
--> statement-breakpoint
ALTER TABLE "material_transfer_header" ADD CONSTRAINT "material_transfer_header_from_store_id_stores_id_fk" FOREIGN KEY ("from_store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_transfer_header" ADD CONSTRAINT "material_transfer_header_to_store_id_stores_id_fk" FOREIGN KEY ("to_store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials_transfer_details" ADD CONSTRAINT "materials_transfer_details_header_id_material_transfer_header_id_fk" FOREIGN KEY ("header_id") REFERENCES "public"."material_transfer_header"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials_transfer_details" ADD CONSTRAINT "materials_transfer_details_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;