CREATE TABLE "permissions" (
	"user_id" uuid NOT NULL,
	"permission" varchar(64) NOT NULL,
	CONSTRAINT "permissions_user_id_permission_pk" PRIMARY KEY("user_id","permission")
);

ALTER TABLE "permissions" ADD CONSTRAINT "permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;