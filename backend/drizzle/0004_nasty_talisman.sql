ALTER TABLE "users" ADD COLUMN "subscription_status" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_product_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_store" text;