CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "stores_store_name_unique" UNIQUE("store_name")
);
--> statement-breakpoint
CREATE INDEX "store_idx" ON "stores" USING btree ("store_name");--> statement-breakpoint
CREATE INDEX "store_description_idx" ON "stores" USING btree ("description");