CREATE TYPE "public"."asset_condition" AS ENUM('new', 'good', 'fair', 'damaged');
CREATE TYPE "public"."asset_status" AS ENUM('in_stock', 'assigned', 'in_repair', 'retired', 'disposed', 'lost');
CREATE TABLE "it_asset_assignments" (
	"id" varchar PRIMARY KEY NOT NULL,
	"asset_id" varchar NOT NULL,
	"user_id" uuid,
	"assigned_date" date NOT NULL,
	"returned_date" date,
	"assignment_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "it_asset_categories" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "it_asset_categories_name_unique" UNIQUE("name")
);

CREATE TABLE "it_assets" (
	"id" varchar PRIMARY KEY NOT NULL,
	"category_id" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"brand" varchar(150),
	"model" varchar(150),
	"serial_number" varchar(150),
	"specs" jsonb,
	"purchase_date" date,
	"purchase_cost" numeric(14, 2),
	"vendor_id" uuid,
	"warranty_expiry_date" date,
	"status" "asset_status" DEFAULT 'in_stock' NOT NULL,
	"condition" "asset_condition" DEFAULT 'new' NOT NULL,
	"department_id" integer,
	"current_assigned_user_id" uuid,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "it_asset_assignments" ADD CONSTRAINT "it_asset_assignments_asset_id_it_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."it_assets"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "it_asset_assignments" ADD CONSTRAINT "it_asset_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "it_assets" ADD CONSTRAINT "it_assets_category_id_it_asset_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."it_asset_categories"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "it_assets" ADD CONSTRAINT "it_assets_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "it_assets" ADD CONSTRAINT "it_assets_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "it_assets" ADD CONSTRAINT "it_assets_current_assigned_user_id_users_id_fk" FOREIGN KEY ("current_assigned_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "it_assets" ADD CONSTRAINT "it_assets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "it_asset_assignments_asset_idx" ON "it_asset_assignments" USING btree ("asset_id");
CREATE INDEX "it_asset_assignments_user_idx" ON "it_asset_assignments" USING btree ("user_id");
CREATE INDEX "it_asset_assignments_assigned_date_idx" ON "it_asset_assignments" USING btree ("assigned_date");
CREATE INDEX "it_asset_assignments_returned_date_idx" ON "it_asset_assignments" USING btree ("returned_date");
CREATE INDEX "it_asset_category_name_idx" ON "it_asset_categories" USING btree ("name");
CREATE UNIQUE INDEX "it_asset_category_name_ci_unique" ON "it_asset_categories" USING btree (lower("name"));
CREATE INDEX "it_assets_category_idx" ON "it_assets" USING btree ("category_id");
CREATE INDEX "it_assets_name_idx" ON "it_assets" USING btree ("name");
CREATE INDEX "it_assets_brand_idx" ON "it_assets" USING btree ("brand");
CREATE INDEX "it_assets_model_idx" ON "it_assets" USING btree ("model");
CREATE INDEX "it_assets_serial_number_idx" ON "it_assets" USING btree ("serial_number");
CREATE INDEX "it_assets_vendor_idx" ON "it_assets" USING btree ("vendor_id");
CREATE INDEX "it_assets_status_idx" ON "it_assets" USING btree ("status");
CREATE INDEX "it_assets_condition_idx" ON "it_assets" USING btree ("condition");
CREATE INDEX "it_assets_department_idx" ON "it_assets" USING btree ("department_id");
CREATE INDEX "it_assets_assigned_user_idx" ON "it_assets" USING btree ("current_assigned_user_id");
CREATE UNIQUE INDEX "it_assets_serial_number_ci_unique" ON "it_assets" USING btree (lower("serial_number"));