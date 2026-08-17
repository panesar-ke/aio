ALTER TABLE "users" ADD COLUMN "prompt_password_change" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token" text;