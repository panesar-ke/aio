-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."aal_level" AS ENUM('aal3', 'aal2', 'aal1');--> statement-breakpoint
CREATE TYPE "public"."accountStateEnum" AS ENUM('lead', 'account');--> statement-breakpoint
CREATE TYPE "public"."appraisalDetailTypeEnum" AS ENUM('OBJECTIVE', 'FINAL');--> statement-breakpoint
CREATE TYPE "public"."appraisalStatusEnum" AS ENUM('NOT SET', 'PENDING', 'STAFF FILLED', 'CONDUCTED', 'COMPLETED', 'FILLED');--> statement-breakpoint
CREATE TYPE "public"."bloodTypeEnum" AS ENUM('A', 'B', 'AB', 'O');--> statement-breakpoint
CREATE TYPE "public"."code_challenge_method" AS ENUM('plain', 's256');--> statement-breakpoint
CREATE TYPE "public"."disciplinaryCaseActionEnum" AS ENUM('VERBAL-WARNING', 'WRITTEN-WARNING', 'SURCHARGE', 'SUSPENSION', 'TERMINATION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."disciplinaryCaseStatusEnum" AS ENUM('REPORTED', 'UNDER-INVESTIGATION', 'RESOLVED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."discountTypeEnum" AS ENUM('NONE', 'PERCENTAGE', 'AMOUNT');--> statement-breakpoint
CREATE TYPE "public"."educationLevelEnum" AS ENUM('PHD', 'MASTERS-DEGREE', 'BACHELORS-DEGREE', 'HIGHER-DIPLOMA', 'DIPLOMA', 'CERTIFICATE', 'SECONDARY', 'PRIMARY', 'NONE');--> statement-breakpoint
CREATE TYPE "public"."educationTypeEnum" AS ENUM('academic', 'professional', 'training');--> statement-breakpoint
CREATE TYPE "public"."employeeCategory" AS ENUM('UNIONISABLE', 'MANAGEMENT', 'NON-UNIONISABLE', 'WORKFLOOR', 'CONTRACTOR');--> statement-breakpoint
CREATE TYPE "public"."employeeStatus" AS ENUM('ACTIVE', 'TERMINATED', 'RESIGNED', 'RETIRED', 'DECEASED');--> statement-breakpoint
CREATE TYPE "public"."employmentType" AS ENUM('PERMANENT', 'CONTRACT', 'CASUAL', 'INTERN', 'NO CONTRACT');--> statement-breakpoint
CREATE TYPE "public"."factor_status" AS ENUM('verified', 'unverified');--> statement-breakpoint
CREATE TYPE "public"."factor_type" AS ENUM('webauthn', 'totp');--> statement-breakpoint
CREATE TYPE "public"."genderEnum" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TYPE "public"."healthSafetyInjuryEnum" AS ENUM('NOT-FILED', 'PENDING', 'REJECTED', 'CLOSED', 'MINOR', 'MAJOR');--> statement-breakpoint
CREATE TYPE "public"."healthSafetyStatusEnum" AS ENUM('NOT-FILED', 'PENDING', 'REJECTED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."key_status" AS ENUM('expired', 'invalid', 'valid', 'default');--> statement-breakpoint
CREATE TYPE "public"."key_type" AS ENUM('stream_xchacha20', 'secretstream', 'secretbox', 'kdf', 'generichash', 'shorthash', 'auth', 'hmacsha256', 'hmacsha512', 'aead-det', 'aead-ietf');--> statement-breakpoint
CREATE TYPE "public"."leadStatusEnum" AS ENUM('new', 'contacted', 'nurturing', 'qualified', 'unqualified', 'lost');--> statement-breakpoint
CREATE TYPE "public"."leaveStatusEnum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."maritalStatusEnum" AS ENUM('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');--> statement-breakpoint
CREATE TYPE "public"."opportunityStageEnum" AS ENUM('prospecting', 'qualification', 'propasal', 'negotiation', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."priorityEnum" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."quotationStatusEnum" AS ENUM('draft', 'sent', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."salutationEnum" AS ENUM('mr', 'mrs', 'ms', 'dr', 'sir', 'prof', 'other');--> statement-breakpoint
CREATE TYPE "public"."stockMovementTypeEnum" AS ENUM('GRN', 'ISSUE', 'TRANSFER', 'CONVERSION', 'CONVERSION_IN', 'CONVERSION_OUT', 'OPENING_BAL');--> statement-breakpoint
CREATE TYPE "public"."supportTicketEnum" AS ENUM('open', 'in progress', 'escalated', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."userRoleEnum" AS ENUM('STANDARD USER', 'ADMIN', 'SUPER ADMIN');--> statement-breakpoint
CREATE TYPE "public"."vatTypeEnum" AS ENUM('NONE', 'EXCLUSIVE', 'INCLUSIVE');--> statement-breakpoint
CREATE TYPE "public"."vehicleStatusEnum" AS ENUM('ACTIVE', 'GROUNDED', 'SOLD');--> statement-breakpoint
CREATE TYPE "public"."workfloorType" AS ENUM('UNIONISABLE', 'NON-UNIONISABLE');--> statement-breakpoint
CREATE TABLE "appraisal_header" (
	"id" serial PRIMARY KEY NOT NULL,
	"appraisal_date" date NOT NULL,
	"staff_id" integer NOT NULL,
	"year_id" integer NOT NULL,
	"appraisal_status" "appraisalStatusEnum" DEFAULT 'PENDING' NOT NULL,
	"conducted_on" date,
	"created_on" date DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"start_time" varchar NOT NULL,
	"end_time" varchar NOT NULL,
	"remarks" text NOT NULL,
	"final_rating_staff" numeric,
	"final_remark_staff" text,
	"final_rating_management" numeric,
	"final_remark_management" text
);
--> statement-breakpoint
CREATE TABLE "calendar_years" (
	"id" integer PRIMARY KEY NOT NULL,
	"year_name" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_extensions" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"old_expiry_date" date NOT NULL,
	"extension_duration" numeric NOT NULL,
	"new_expiry_date" date NOT NULL,
	"remarks" text,
	"created_by" uuid NOT NULL,
	"created_date" date DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendances" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"attendance_date" date NOT NULL,
	"employee_id" integer NOT NULL,
	"time_in" varchar(6),
	"break" varchar(6),
	"resume" varchar(6),
	"time_out" varchar(6),
	"work_hour" numeric,
	"ot_hour" numeric,
	"short_hour" numeric
);
--> statement-breakpoint
CREATE TABLE "conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversion_date" date DEFAULT now() NOT NULL,
	"converting_item" uuid,
	"converting_quantity" numeric,
	"converted_item" uuid NOT NULL,
	"converted_quantity" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disciplinary_cases" (
	"id" text PRIMARY KEY NOT NULL,
	"case_date" date NOT NULL,
	"incidence_description" text NOT NULL,
	"remarks" text NOT NULL,
	"case_status" "disciplinaryCaseStatusEnum" DEFAULT 'REPORTED' NOT NULL,
	"case_action" "disciplinaryCaseActionEnum" NOT NULL,
	"other_action" varchar,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"department_name" varchar NOT NULL,
	"is_production" boolean DEFAULT true NOT NULL,
	"production_flow" integer
);
--> statement-breakpoint
CREATE TABLE "designations" (
	"id" integer PRIMARY KEY NOT NULL,
	"designation_name" varchar(150) NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counties" (
	"id" integer PRIMARY KEY NOT NULL,
	"county" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_qualifications" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"qualification_type" "educationTypeEnum" NOT NULL,
	"from" varchar,
	"to" varchar,
	"school" varchar,
	"attainment" varchar,
	"specialization" varchar
);
--> statement-breakpoint
CREATE TABLE "employee_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_terminations" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"termination_date" date NOT NULL,
	"reason" text NOT NULL,
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "employee_certifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"certification" varchar NOT NULL,
	"score" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact" varchar(10) NOT NULL,
	"password" text,
	"employee_type" "employeeCategory" DEFAULT 'MANAGEMENT' NOT NULL,
	"email" text,
	"image" text,
	"active" boolean DEFAULT true NOT NULL,
	"prompt_password_change" boolean DEFAULT false,
	"reset_token" text,
	"employee_ref_id" integer NOT NULL,
	"id_number" text,
	CONSTRAINT "employee_users_contact_unique" UNIQUE("contact")
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" integer PRIMARY KEY NOT NULL,
	"reference" uuid DEFAULT gen_random_uuid() NOT NULL,
	"surname" varchar(255) NOT NULL,
	"other_names" varchar NOT NULL,
	"gender" "genderEnum" NOT NULL,
	"dob" date NOT NULL,
	"marital_status" "maritalStatusEnum",
	"id_no" varchar(15),
	"payroll_no" varchar(6),
	"department" integer NOT NULL,
	"designation" integer NOT NULL,
	"employment_type" "employmentType",
	"contract_date" date DEFAULT now(),
	"joining_date" date DEFAULT now(),
	"contract_duration" integer DEFAULT 0 NOT NULL,
	"expiry_date" date,
	"employee_category" "employeeCategory" NOT NULL,
	"spouse_name" varchar(255),
	"spouse_contact" varchar(15),
	"employee_status" "employeeStatus" DEFAULT 'ACTIVE' NOT NULL,
	"image_url" text,
	"remarks" text,
	"is_new" boolean DEFAULT true NOT NULL,
	"nationality" varchar(100),
	"ethnicity" varchar(100),
	"workfloor_type" "workfloorType",
	"attendance_id" integer,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees_noks" (
	"employee_id" integer NOT NULL,
	"name_one" varchar,
	"relation_one" varchar,
	"contact_one" varchar(15),
	"name_two" varchar,
	"relation_two" varchar,
	"contact_two" varchar(15),
	"incase_of_emergency" varchar,
	"incase_of_emergencey_contact" varchar,
	"incase_of_emergencey_relation" varchar
);
--> statement-breakpoint
CREATE TABLE "employees_otherdetails" (
	"employee_id" integer NOT NULL,
	"nhif" varchar,
	"nssf" varchar,
	"kra_pin" varchar,
	"allergies" boolean DEFAULT false NOT NULL,
	"allegry_description" varchar,
	"illness" boolean DEFAULT false NOT NULL,
	"illness_description" varchar,
	"conviction" boolean DEFAULT false NOT NULL,
	"conviction_description" varchar,
	"blood_type" "bloodTypeEnum",
	"education_level" "educationLevelEnum",
	"terminated" boolean DEFAULT false NOT NULL,
	"termination_description" varchar,
	"effective_date" date,
	"bank_name" varchar,
	"branch_name" varchar,
	"account_no" varchar,
	"account_name" varchar,
	"sha_no" varchar
);
--> statement-breakpoint
CREATE TABLE "grns_header" (
	"id" bigint PRIMARY KEY NOT NULL,
	"receipt_date" date DEFAULT now() NOT NULL,
	"invoice_no" varchar,
	"vendor_id" uuid,
	"created_by" uuid NOT NULL,
	"created_on" date DEFAULT now(),
	"is_deleted" boolean DEFAULT false,
	"order_id" bigint
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_name" varchar(100) NOT NULL,
	"module" varchar NOT NULL,
	"module_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"menu_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_safety" (
	"id" text PRIMARY KEY NOT NULL,
	"incidence_date" date NOT NULL,
	"employee_id" integer NOT NULL,
	"department_id" integer NOT NULL,
	"incedence_description" text NOT NULL,
	"injury_severity" "healthSafetyInjuryEnum" NOT NULL,
	"application_status" "healthSafetyStatusEnum" DEFAULT 'NOT-FILED' NOT NULL,
	"application_date" date,
	"resolution_date" date,
	"amount_awarded" numeric
);
--> statement-breakpoint
CREATE TABLE "jobcard_staffs" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" uuid NOT NULL,
	"staff_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees_children" (
	"employee_id" integer NOT NULL,
	"childname" varchar,
	"dob" date
);
--> statement-breakpoint
CREATE TABLE "employees_contacts" (
	"employee_id" integer NOT NULL,
	"primary_contact" varchar(15),
	"alternative_contact" varchar,
	"address" varchar,
	"postal_code" varchar(5),
	"estate" varchar,
	"street" varchar,
	"county_id" integer,
	"district" varchar,
	"location" varchar,
	"village" varchar,
	"email_address" varchar(255),
	"passport" varchar,
	"driving_license" varchar
);
--> statement-breakpoint
CREATE TABLE "kpis" (
	"id" text PRIMARY KEY NOT NULL,
	"kpi" text NOT NULL,
	"designation_id" integer
);
--> statement-breakpoint
CREATE TABLE "jobcard_times" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" uuid NOT NULL,
	"pause_time" timestamp NOT NULL,
	"resume_time" timestamp NOT NULL,
	"remarks" text,
	"is_start" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_applications" (
	"leave_no" integer PRIMARY KEY NOT NULL,
	"employee_category" "employeeCategory" NOT NULL,
	"employee_id" integer NOT NULL,
	"leave_type_id" integer NOT NULL,
	"application_date" date DEFAULT now() NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"resume_date" date NOT NULL,
	"days_taken" numeric NOT NULL,
	"leave_status" "leaveStatusEnum" DEFAULT 'PENDING' NOT NULL,
	"reason" text,
	"authorized_by" uuid,
	"approved_by" uuid,
	"is_unpaid" boolean DEFAULT false,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"attachment_url" text
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
	"id" integer PRIMARY KEY NOT NULL,
	"leave_type_name" varchar NOT NULL,
	"allocation_management" numeric NOT NULL,
	"allocation_workshop" numeric NOT NULL,
	"is_paid_leave" boolean NOT NULL,
	"requires_attachment" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loan_deductions" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_id" integer,
	"deduction_amount" numeric NOT NULL,
	"deduction_date" date NOT NULL,
	"remarks" text,
	"created_by" uuid NOT NULL,
	"created_date" date DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_issues_header" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_no" integer NOT NULL,
	"issue_date" date DEFAULT now() NOT NULL,
	"staff_name" varchar,
	"jobcard_no" varchar(6),
	"text" text,
	"issued_by" uuid NOT NULL,
	"created_on" date DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "material_issues_header_issue_no_unique" UNIQUE("issue_no")
);
--> statement-breakpoint
CREATE TABLE "motor_vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"plate_number" text NOT NULL,
	"make" text,
	"model" text,
	"year" integer,
	"vehicle_type" text,
	"status" "vehicleStatusEnum" DEFAULT 'ACTIVE'
);
--> statement-breakpoint
CREATE TABLE "jobcard_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jobcard_no" varchar(10),
	"department_id" integer NOT NULL,
	"assigned_hours" numeric DEFAULT '0' NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"hours_stopped" numeric DEFAULT '0' NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"remarks" text,
	"jobcard_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobcards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jobcard_no" varchar(7) NOT NULL,
	"client" varchar NOT NULL,
	"description" text NOT NULL,
	"value" numeric DEFAULT '0' NOT NULL,
	"closed" boolean DEFAULT false NOT NULL,
	"jobcard_date" date DEFAULT now() NOT NULL,
	"created_date" date DEFAULT now() NOT NULL,
	"category" varchar,
	CONSTRAINT "jobcards_jobcard_no_unique" UNIQUE("jobcard_no")
);
--> statement-breakpoint
CREATE TABLE "mrq_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"header_id" integer NOT NULL,
	"request_id" bigint NOT NULL,
	"project_id" uuid NOT NULL,
	"item_id" uuid,
	"unit_id" integer NOT NULL,
	"qty" numeric NOT NULL,
	"remarks" varchar,
	"linked" boolean DEFAULT false NOT NULL,
	"service_id" uuid,
	CONSTRAINT "mrq_details_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "odometer_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"reading_date" date DEFAULT now() NOT NULL,
	"reading" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"employee_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunities_files" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"file_url" varchar NOT NULL,
	"opportunity_id" varchar NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(150) NOT NULL,
	"message" text NOT NULL,
	"created_on" timestamp DEFAULT now() NOT NULL,
	"path" varchar NOT NULL,
	"addressed_to" uuid NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"notification_type" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"account_id" uuid NOT NULL,
	"description" varchar,
	"estimated_value" numeric,
	"probability" numeric,
	"close_date" date,
	"stage" "opportunityStageEnum" DEFAULT 'prospecting' NOT NULL,
	"sales_rep_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_name" varchar NOT NULL,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_name" varchar NOT NULL,
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "project_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" varchar NOT NULL,
	"comment" varchar NOT NULL,
	"posted_by" varchar NOT NULL,
	"posted_date" date DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders_header" (
	"id" bigint PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"document_date" date NOT NULL,
	"vendor_id" uuid NOT NULL,
	"bill_no" varchar,
	"mrq_id" integer,
	"bill_date" date,
	"created_by" uuid NOT NULL,
	"created_on" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false,
	"vat_type" "vatTypeEnum" DEFAULT 'NONE' NOT NULL,
	"vat_id" integer,
	"srn_receipt" boolean DEFAULT false,
	"display_odometer_readings_on_print" boolean DEFAULT false,
	"vehicle_id" integer,
	"grn_receipt" boolean DEFAULT false,
	CONSTRAINT "orders_header_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "project_components" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" varchar NOT NULL,
	"description" varchar NOT NULL,
	"quantity" numeric DEFAULT '1' NOT NULL,
	"remarks" varchar
);
--> statement-breakpoint
CREATE TABLE "project_financials" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" varchar NOT NULL,
	"description" varchar NOT NULL,
	"rate" numeric DEFAULT '1' NOT NULL,
	"quantity" numeric DEFAULT '1' NOT NULL,
	"remarks" varchar
);
--> statement-breakpoint
CREATE TABLE "quotations_header" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_date" date NOT NULL,
	"quotation_no" varchar NOT NULL,
	"account_id" uuid NOT NULL,
	"sales_rep_id" uuid NOT NULL,
	"validity_days" integer DEFAULT 30 NOT NULL,
	"status" "quotationStatusEnum" DEFAULT 'draft' NOT NULL,
	"vat_type" "vatTypeEnum" DEFAULT 'NONE' NOT NULL,
	"vat_rate" numeric DEFAULT '0' NOT NULL,
	"sub_total" numeric NOT NULL,
	"discounted" numeric DEFAULT '0' NOT NULL,
	"vat_amount" numeric NOT NULL,
	"total_amount" numeric NOT NULL,
	"notes" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salutation" "salutationEnum",
	"name" varchar NOT NULL,
	"company" varchar NOT NULL,
	"title" varchar,
	"email" varchar,
	"phone" varchar,
	"description" varchar,
	"status" "leadStatusEnum" DEFAULT 'new' NOT NULL,
	"lead_source" varchar,
	"sales_rep_id" uuid NOT NULL,
	"state" "accountStateEnum" DEFAULT 'account' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"kra_pin" varchar(15)
);
--> statement-breakpoint
CREATE TABLE "quotations_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"item_name" varchar NOT NULL,
	"description" varchar,
	"quantity" numeric NOT NULL,
	"unit_price" numeric NOT NULL,
	"discount" numeric DEFAULT '0' NOT NULL,
	"total_price" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" varchar NOT NULL,
	"menu_name" varchar NOT NULL,
	"default_page_path" varchar(255) DEFAULT '/dashboard' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"header_id" integer NOT NULL,
	"project_id" uuid NOT NULL,
	"item_id" uuid,
	"qty" numeric NOT NULL,
	"rate" numeric NOT NULL,
	"discount_type" "discountTypeEnum" DEFAULT 'NONE' NOT NULL,
	"discount" numeric NOT NULL,
	"discounted_amount" numeric NOT NULL,
	"vat_type" "vatTypeEnum",
	"vat_id" integer,
	"amount_exclusive" numeric NOT NULL,
	"vat" numeric NOT NULL,
	"amount_inclusive" numeric NOT NULL,
	"received" boolean DEFAULT false,
	"service_id" uuid,
	"request_id" bigint
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_name" varchar NOT NULL,
	"category_id" integer NOT NULL,
	"uom_id" integer,
	"buying_price" numeric,
	"active" boolean DEFAULT true,
	"stock_item" boolean DEFAULT true,
	"is_peace" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "previous_lost_hours" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"lost_hour_month" integer NOT NULL,
	"lateness" numeric,
	"early_exit" numeric,
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "sales_support_tickets" (
	"id" varchar PRIMARY KEY NOT NULL,
	"subject" varchar NOT NULL,
	"account_id" uuid NOT NULL,
	"description" varchar NOT NULL,
	"case_date" date NOT NULL,
	"status" "supportTicketEnum" DEFAULT 'open' NOT NULL,
	"priority" "priorityEnum" DEFAULT 'low' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uoms" (
	"id" serial PRIMARY KEY NOT NULL,
	"uom" varchar NOT NULL,
	"abbreviation" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "srns_header" (
	"id" bigint PRIMARY KEY NOT NULL,
	"receipt_date" date DEFAULT now() NOT NULL,
	"order_id" integer,
	"created_by" uuid NOT NULL,
	"created_on" date DEFAULT now(),
	"is_deleted" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "sales_orders_header" (
	"id" integer PRIMARY KEY NOT NULL,
	"sale_order_no" integer NOT NULL,
	"date_raised" date NOT NULL,
	"account_id" uuid,
	"opportunity_id" uuid,
	"expected_date" date,
	"vat_type" "vatTypeEnum" DEFAULT 'NONE' NOT NULL,
	"vat_rate" numeric DEFAULT '0' NOT NULL,
	"amount_exclusive" numeric NOT NULL,
	"vat_amount" numeric NOT NULL,
	"amount_inclusive" numeric NOT NULL,
	"sales_rep_id" uuid NOT NULL,
	"display" boolean DEFAULT true NOT NULL,
	"import_ref_id" integer
);
--> statement-breakpoint
CREATE TABLE "staff_objectives_header" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"year_id" integer NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"approved_by" uuid,
	"approved_date" date,
	"created_on" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_name" varchar NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"service_fee" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_date" date DEFAULT now() NOT NULL,
	"item_id" uuid NOT NULL,
	"qty" numeric NOT NULL,
	"transaction_type" "stockMovementTypeEnum" NOT NULL,
	"transaction_id" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_on" date DEFAULT now(),
	"remarks" text,
	"is_deleted" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "temp_debtors" (
	"id" text PRIMARY KEY NOT NULL,
	"debtors_name" varchar(150) NOT NULL,
	"email" varchar NOT NULL,
	"contact" varchar,
	"debt_amount" numeric NOT NULL,
	CONSTRAINT "temp_debtors_email_unique" UNIQUE("email"),
	CONSTRAINT "temp_debtors_contact_unique" UNIQUE("contact")
);
--> statement-breakpoint
CREATE TABLE "site_projects" (
	"id" varchar PRIMARY KEY NOT NULL,
	"client" varchar NOT NULL,
	"location" varchar NOT NULL,
	"subject" varchar NOT NULL,
	"revenue_allocated" numeric DEFAULT '1' NOT NULL,
	"installation_date" date NOT NULL,
	"timeline_allocated" numeric DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_date" date NOT NULL,
	"employee_id" integer,
	"loan_amount" numeric NOT NULL,
	"loan_duration" integer NOT NULL,
	"deductable_amount" numeric DEFAULT '0' NOT NULL,
	"reason" text,
	"attachment" text,
	"completed" boolean DEFAULT false NOT NULL,
	"approved_amount" numeric DEFAULT '0' NOT NULL,
	"approval_date" date,
	"monthy_salary" numeric,
	"loan_type" varchar DEFAULT 'existing',
	"loan_status" "leaveStatusEnum" DEFAULT 'PENDING' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "srns_details" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"header_id" integer NOT NULL,
	"service_id" uuid NOT NULL,
	"qty_ordered" numeric NOT NULL,
	"qty_received" numeric NOT NULL,
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "staff_objectives_details" (
	"id" text PRIMARY KEY NOT NULL,
	"header_id" integer NOT NULL,
	"kpi_id" text NOT NULL,
	"objective" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vats" (
	"id" serial PRIMARY KEY NOT NULL,
	"value" integer NOT NULL,
	"vat_name" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_name" text NOT NULL,
	"contact" varchar(20),
	"kra_pin" varchar(50),
	"address" text,
	"email" varchar,
	"contact_person" varchar,
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact" varchar(10) NOT NULL,
	"password" text NOT NULL,
	"user_type" "userRoleEnum" DEFAULT 'STANDARD USER' NOT NULL,
	"contact_verified" timestamp,
	"email" text,
	"image" text,
	"default_menu" varchar,
	"active" boolean DEFAULT true NOT NULL,
	"role" integer,
	"prompt_password_change" boolean DEFAULT false,
	"reset_token" text,
	"has_admin_priviledges" boolean DEFAULT false NOT NULL,
	CONSTRAINT "users_contact_unique" UNIQUE("contact"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "appraisal_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"header_id" integer NOT NULL,
	"kpi" varchar NOT NULL,
	"objective" text NOT NULL,
	"staff_rating" numeric NOT NULL,
	"staff_remarks" text NOT NULL,
	"supervisor_remarks" text,
	"final_remarks" text,
	"final_rating" numeric,
	"detail_type" "appraisalDetailTypeEnum"
);
--> statement-breakpoint
CREATE TABLE "grns_details" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"header_id" integer NOT NULL,
	"item_id" uuid NOT NULL,
	"qty" numeric NOT NULL,
	"rate" numeric NOT NULL,
	"remarks" text,
	"ordered_qty" numeric
);
--> statement-breakpoint
CREATE TABLE "mrq_headers" (
	"id" bigint PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"document_date" timestamp NOT NULL,
	"linked" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_on" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_orders_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"header_id" integer NOT NULL,
	"item" varchar NOT NULL,
	"qty" numeric NOT NULL,
	"rate" numeric NOT NULL,
	"amount" numeric NOT NULL,
	"category" varchar
);
--> statement-breakpoint
CREATE TABLE "disciplinary_cases_documents" (
	"case_id" text NOT NULL,
	"uploaded_url" text NOT NULL,
	CONSTRAINT "disciplinary_cases_documents_case_id_uploaded_url_pk" PRIMARY KEY("case_id","uploaded_url")
);
--> statement-breakpoint
CREATE TABLE "disciplinary_cases_personnel" (
	"staff_id" integer NOT NULL,
	"case_id" text NOT NULL,
	CONSTRAINT "disciplinary_cases_personnel_case_id_staff_id_pk" PRIMARY KEY("staff_id","case_id")
);
--> statement-breakpoint
CREATE TABLE "health_safety_documents" (
	"case_id" text NOT NULL,
	"uploaded_url" text NOT NULL,
	CONSTRAINT "health_safety_documents_case_id_uploaded_url_pk" PRIMARY KEY("case_id","uploaded_url")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" integer NOT NULL,
	CONSTRAINT "user_roles_role_id_user_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
ALTER TABLE "appraisal_header" ADD CONSTRAINT "appraisal_header_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appraisal_header" ADD CONSTRAINT "appraisal_header_staff_id_employees_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appraisal_header" ADD CONSTRAINT "appraisal_header_year_id_calendar_years_id_fk" FOREIGN KEY ("year_id") REFERENCES "public"."calendar_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_extensions" ADD CONSTRAINT "contract_extensions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_extensions" ADD CONSTRAINT "contract_extensions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_converted_item_products_id_fk" FOREIGN KEY ("converted_item") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_converting_item_products_id_fk" FOREIGN KEY ("converting_item") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_qualifications" ADD CONSTRAINT "employee_qualifications_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_session" ADD CONSTRAINT "employee_session_user_id_employee_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."employee_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_terminations" ADD CONSTRAINT "employee_terminations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_certifications" ADD CONSTRAINT "employee_certifications_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_departments_id_fk" FOREIGN KEY ("department") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_designation_designations_id_fk" FOREIGN KEY ("designation") REFERENCES "public"."designations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees_noks" ADD CONSTRAINT "employees_noks_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees_otherdetails" ADD CONSTRAINT "employees_otherdetails_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grns_header" ADD CONSTRAINT "grns_header_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grns_header" ADD CONSTRAINT "grns_header_order_id_orders_header_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders_header"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grns_header" ADD CONSTRAINT "grns_header_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_safety" ADD CONSTRAINT "health_safety_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_safety" ADD CONSTRAINT "health_safety_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobcard_staffs" ADD CONSTRAINT "jobcard_staffs_staff_id_employees_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobcard_staffs" ADD CONSTRAINT "jobcard_staffs_task_id_jobcard_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."jobcard_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees_children" ADD CONSTRAINT "employees_children_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees_contacts" ADD CONSTRAINT "employees_contacts_county_id_counties_id_fk" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees_contacts" ADD CONSTRAINT "employees_contacts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_designation_id_designations_id_fk" FOREIGN KEY ("designation_id") REFERENCES "public"."designations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobcard_times" ADD CONSTRAINT "jobcard_times_task_id_jobcard_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."jobcard_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_authorized_by_users_id_fk" FOREIGN KEY ("authorized_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_deductions" ADD CONSTRAINT "loan_deductions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_deductions" ADD CONSTRAINT "loan_deductions_loan_id_staff_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."staff_loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_issues_header" ADD CONSTRAINT "material_issues_header_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobcard_tasks" ADD CONSTRAINT "jobcard_tasks_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobcard_tasks" ADD CONSTRAINT "jobcard_tasks_jobcard_id_jobcards_id_fk" FOREIGN KEY ("jobcard_id") REFERENCES "public"."jobcards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrq_details" ADD CONSTRAINT "mrq_details_header_id_mrq_headers_id_fk" FOREIGN KEY ("header_id") REFERENCES "public"."mrq_headers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrq_details" ADD CONSTRAINT "mrq_details_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrq_details" ADD CONSTRAINT "mrq_details_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrq_details" ADD CONSTRAINT "mrq_details_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrq_details" ADD CONSTRAINT "mrq_details_unit_id_uoms_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."uoms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "odometer_readings" ADD CONSTRAINT "odometer_readings_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "odometer_readings" ADD CONSTRAINT "odometer_readings_vehicle_id_motor_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."motor_vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities_files" ADD CONSTRAINT "opportunities_files_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities_files" ADD CONSTRAINT "opportunities_files_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_addressed_to_users_id_fk" FOREIGN KEY ("addressed_to") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_account_id_sale_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."sale_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_sales_rep_id_users_id_fk" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_comments" ADD CONSTRAINT "project_comments_project_id_site_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."site_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders_header" ADD CONSTRAINT "orders_header_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders_header" ADD CONSTRAINT "orders_header_mrq_id_mrq_headers_id_fk" FOREIGN KEY ("mrq_id") REFERENCES "public"."mrq_headers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders_header" ADD CONSTRAINT "orders_header_vat_id_vats_id_fk" FOREIGN KEY ("vat_id") REFERENCES "public"."vats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders_header" ADD CONSTRAINT "orders_header_vehicle_id_motor_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."motor_vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders_header" ADD CONSTRAINT "orders_header_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_components" ADD CONSTRAINT "project_components_project_id_site_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."site_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_financials" ADD CONSTRAINT "project_financials_project_id_site_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."site_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations_header" ADD CONSTRAINT "quotations_header_account_id_sale_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."sale_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations_header" ADD CONSTRAINT "quotations_header_sales_rep_id_users_id_fk" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_accounts" ADD CONSTRAINT "sale_accounts_sales_rep_id_users_id_fk" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations_items" ADD CONSTRAINT "quotations_items_quotation_id_quotations_header_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations_header"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders_details" ADD CONSTRAINT "orders_details_header_id_orders_header_id_fk" FOREIGN KEY ("header_id") REFERENCES "public"."orders_header"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders_details" ADD CONSTRAINT "orders_details_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders_details" ADD CONSTRAINT "orders_details_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders_details" ADD CONSTRAINT "orders_details_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders_details" ADD CONSTRAINT "orders_details_vat_id_vats_id_fk" FOREIGN KEY ("vat_id") REFERENCES "public"."vats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_uom_id_uoms_id_fk" FOREIGN KEY ("uom_id") REFERENCES "public"."uoms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "previous_lost_hours" ADD CONSTRAINT "previous_lost_hours_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_support_tickets" ADD CONSTRAINT "sales_support_tickets_account_id_sale_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."sale_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_support_tickets" ADD CONSTRAINT "sales_support_tickets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srns_header" ADD CONSTRAINT "srns_header_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srns_header" ADD CONSTRAINT "srns_header_order_id_orders_header_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders_header"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders_header" ADD CONSTRAINT "sales_orders_header_account_id_sale_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."sale_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders_header" ADD CONSTRAINT "sales_orders_header_sales_rep_id_users_id_fk" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_objectives_header" ADD CONSTRAINT "staff_objectives_header_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_objectives_header" ADD CONSTRAINT "staff_objectives_header_staff_id_employees_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_objectives_header" ADD CONSTRAINT "staff_objectives_header_year_id_calendar_years_id_fk" FOREIGN KEY ("year_id") REFERENCES "public"."calendar_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_loans" ADD CONSTRAINT "staff_loans_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srns_details" ADD CONSTRAINT "srns_details_header_id_srns_header_id_fk" FOREIGN KEY ("header_id") REFERENCES "public"."srns_header"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srns_details" ADD CONSTRAINT "srns_details_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_objectives_details" ADD CONSTRAINT "staff_objectives_details_header_id_staff_objectives_header_id_f" FOREIGN KEY ("header_id") REFERENCES "public"."staff_objectives_header"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_objectives_details" ADD CONSTRAINT "staff_objectives_details_kpi_id_kpis_id_fk" FOREIGN KEY ("kpi_id") REFERENCES "public"."kpis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_roles_id_fk" FOREIGN KEY ("role") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appraisal_details" ADD CONSTRAINT "appraisal_details_header_id_appraisal_header_id_fk" FOREIGN KEY ("header_id") REFERENCES "public"."appraisal_header"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grns_details" ADD CONSTRAINT "grns_details_header_id_grns_header_id_fk" FOREIGN KEY ("header_id") REFERENCES "public"."grns_header"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grns_details" ADD CONSTRAINT "grns_details_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrq_headers" ADD CONSTRAINT "mrq_headers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders_details" ADD CONSTRAINT "sales_orders_details_header_id_sales_orders_header_id_fk" FOREIGN KEY ("header_id") REFERENCES "public"."sales_orders_header"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disciplinary_cases_documents" ADD CONSTRAINT "disciplinary_cases_documents_case_id_disciplinary_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."disciplinary_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disciplinary_cases_personnel" ADD CONSTRAINT "disciplinary_cases_personnel_case_id_disciplinary_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."disciplinary_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disciplinary_cases_personnel" ADD CONSTRAINT "disciplinary_cases_personnel_staff_id_employees_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_safety_documents" ADD CONSTRAINT "health_safety_documents_case_id_health_safety_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."health_safety"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "employee_user_contact_idx" ON "employee_users" USING btree ("contact" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "employee_user_id_number_idx" ON "employee_users" USING btree ("id_number" text_ops);--> statement-breakpoint
CREATE INDEX "employee_user_name_idx" ON "employee_users" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "employee_othernames_idx" ON "employees" USING btree ("other_names" text_ops);--> statement-breakpoint
CREATE INDEX "employee_surname_idx" ON "employees" USING btree ("surname" text_ops);--> statement-breakpoint
CREATE INDEX "jobard_tasks_idx" ON "jobcard_tasks" USING btree ("jobcard_no" text_ops);--> statement-breakpoint
CREATE INDEX "project_name_idx" ON "projects" USING btree ("project_name" text_ops);--> statement-breakpoint
CREATE INDEX "product_name_idx" ON "products" USING btree ("product_name" text_ops);--> statement-breakpoint
CREATE INDEX "vendor_name_idx" ON "vendors" USING btree ("vendor_name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "contact_idx" ON "users" USING btree ("contact" text_ops);--> statement-breakpoint
CREATE INDEX "user_name_idx" ON "users" USING btree ("name" text_ops);
*/