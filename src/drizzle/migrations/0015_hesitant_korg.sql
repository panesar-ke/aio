CREATE TABLE "it_categories" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "it_categories_name_unique" UNIQUE("name")
);
CREATE TABLE "it_sub_categories" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category_id" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "it_sub_categories" ADD CONSTRAINT "it_sub_categories_category_id_it_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."it_categories"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "it_category_name_idx" ON "it_categories" USING btree ("name");
CREATE INDEX "it_sub_category_name_idx" ON "it_sub_categories" USING btree ("name");
CREATE INDEX "it_sub_category_category_idx" ON "it_sub_categories" USING btree ("category_id");