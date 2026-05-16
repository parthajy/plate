CREATE TABLE IF NOT EXISTS "scan_cache" (
	"sha256" text PRIMARY KEY NOT NULL,
	"image_url" text NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
