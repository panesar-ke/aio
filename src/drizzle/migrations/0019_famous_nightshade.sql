CREATE TABLE "it_expenses" (
	"id" varchar PRIMARY KEY NOT NULL,
	"expense_date" date NOT NULL,
	"reference_no" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category_id" varchar NOT NULL,
	"sub_category_id" varchar,
	"vendor_id" uuid NOT NULL,
	"asset_id" uuid,
	"license_id" uuid,
	"amount" numeric(14, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "it_expenses_reference_no_unique" UNIQUE("reference_no")
);

ALTER TABLE "it_expenses" ADD CONSTRAINT "it_expenses_category_id_it_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."it_categories"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "it_expenses" ADD CONSTRAINT "it_expenses_sub_category_id_it_sub_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."it_sub_categories"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "it_expenses" ADD CONSTRAINT "it_expenses_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "it_expense_name_idx" ON "it_expenses" USING btree ("title");
CREATE INDEX "it_expense_date_idx" ON "it_expenses" USING btree ("expense_date");
CREATE INDEX "it_expense_category_idx" ON "it_expenses" USING btree ("category_id");
CREATE INDEX "it_expense_sub_category_idx" ON "it_expenses" USING btree ("sub_category_id");
CREATE INDEX "it_expense_vendor_idx" ON "it_expenses" USING btree ("vendor_id");
CREATE INDEX "it_expense_asset_idx" ON "it_expenses" USING btree ("asset_id");
CREATE INDEX "it_expense_license_idx" ON "it_expenses" USING btree ("license_id");
CREATE INDEX "it_expense_amount_idx" ON "it_expenses" USING btree ("amount");
CREATE UNIQUE INDEX "it_expense_reference_no_ci_unique" ON "it_expenses" USING btree (lower("reference_no"));