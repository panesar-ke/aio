CREATE TABLE "stock_balance_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"snapshot_date" date NOT NULL,
	"closing_balance" numeric NOT NULL,
	"created_on" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "stock_balance_snapshots" ADD CONSTRAINT "stock_balance_snapshots_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_balance_snapshots" ADD CONSTRAINT "stock_balance_snapshots_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "stock_balance_snapshots_item_store_date_idx" ON "stock_balance_snapshots" USING btree ("item_id","store_id","snapshot_date");--> statement-breakpoint
CREATE INDEX "stock_movements_store_item_date_idx" ON "stock_movements" USING btree ("store_id","item_id","transaction_date") WHERE "stock_movements"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "stock_movements_store_date_item_idx" ON "stock_movements" USING btree ("store_id","transaction_date","item_id") WHERE "stock_movements"."is_deleted" = false;