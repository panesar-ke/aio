CREATE TYPE "public"."product_import_batch_status" AS ENUM('queued', 'processing', 'completed', 'completed_with_errors', 'failed');--> statement-breakpoint
CREATE TYPE "public"."product_import_row_status" AS ENUM('success', 'error');--> statement-breakpoint
CREATE TABLE "product_import_batch_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"raw_data" jsonb NOT NULL,
	"status" "product_import_row_status" NOT NULL,
	"error_message" text,
	"product_id" uuid
);
--> statement-breakpoint
CREATE TABLE "product_import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"as_of_date" text NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_data" text NOT NULL,
	"status" "product_import_batch_status" DEFAULT 'queued' NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"success_rows" integer DEFAULT 0 NOT NULL,
	"failed_rows" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "product_import_batch_rows" ADD CONSTRAINT "product_import_batch_rows_batch_id_product_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."product_import_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_import_batch_rows" ADD CONSTRAINT "product_import_batch_rows_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_import_batches" ADD CONSTRAINT "product_import_batches_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_import_batches" ADD CONSTRAINT "product_import_batches_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_import_batch_rows_batch_idx" ON "product_import_batch_rows" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "product_import_batches_store_idx" ON "product_import_batches" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "product_import_batches_status_idx" ON "product_import_batches" USING btree ("status");