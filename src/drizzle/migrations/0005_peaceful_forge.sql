CREATE TABLE "user_rights" (
	"user_id" uuid NOT NULL,
	"form_id" integer NOT NULL,
	CONSTRAINT "user_rights_user_id_form_id_pk" PRIMARY KEY("user_id","form_id")
);
--> statement-breakpoint
ALTER TABLE "user_rights" ADD CONSTRAINT "user_rights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_rights" ADD CONSTRAINT "user_rights_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;