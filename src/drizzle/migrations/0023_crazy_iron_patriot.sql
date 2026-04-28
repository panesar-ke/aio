CREATE TYPE "public"."asset_assignment_custody_type" AS ENUM('user', 'department');--> statement-breakpoint
ALTER TABLE "it_asset_assignments" ADD COLUMN "asset_assignment_custody_type" "asset_assignment_custody_type" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "it_asset_assignments" ADD COLUMN "department_id" integer;--> statement-breakpoint
ALTER TABLE "it_asset_assignments" ADD CONSTRAINT "it_asset_assignments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;