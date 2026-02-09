CREATE TABLE "website_enquiry_dedup" (
	"finger_print" varchar(255) NOT NULL,
	"sender_email" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "website_enquiry_dedup_finger_print_sender_email_pk" PRIMARY KEY("finger_print","sender_email")
);
--> statement-breakpoint
CREATE TABLE "website_round_robin" (
	"id" integer PRIMARY KEY NOT NULL,
	"counter" bigint NOT NULL
);
