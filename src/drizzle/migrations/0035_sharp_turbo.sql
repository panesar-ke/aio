ALTER TABLE "sales_orders_header" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sales_orders_header" ADD COLUMN "cancelled_by" uuid;--> statement-breakpoint
ALTER TABLE "sales_orders_header" ADD CONSTRAINT "sales_orders_header_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;