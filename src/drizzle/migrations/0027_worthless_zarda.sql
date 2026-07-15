CREATE TABLE "it_budget_lines" (
	"id" varchar PRIMARY KEY NOT NULL,
	"budget_id" varchar NOT NULL,
	"month_date" date NOT NULL,
	"amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "it_budgets" (
	"id" varchar PRIMARY KEY NOT NULL,
	"financial_year_start" integer NOT NULL,
	"sub_category_id" varchar NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "it_budget_lines" ADD CONSTRAINT "it_budget_lines_budget_id_it_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."it_budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_budgets" ADD CONSTRAINT "it_budgets_sub_category_id_it_sub_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."it_sub_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_budgets" ADD CONSTRAINT "it_budgets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "it_budget_line_month_idx" ON "it_budget_lines" USING btree ("month_date");--> statement-breakpoint
CREATE UNIQUE INDEX "it_budget_line_budget_month_unique" ON "it_budget_lines" USING btree ("budget_id","month_date");--> statement-breakpoint
CREATE INDEX "it_budget_fy_idx" ON "it_budgets" USING btree ("financial_year_start");--> statement-breakpoint
CREATE INDEX "it_budget_sub_category_idx" ON "it_budgets" USING btree ("sub_category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "it_budget_fy_sub_category_unique" ON "it_budgets" USING btree ("financial_year_start","sub_category_id");
