CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"title" text NOT NULL,
	"creator" text,
	"version" text,
	"views" integer,
	"likes" integer,
	"prefixes" integer[],
	"tags" integer[],
	"rating" real,
	"cover" text,
	"screens" text[],
	"timestamp" bigint,
	"watched" boolean DEFAULT false,
	"ignored" boolean DEFAULT false,
	"is_new" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "games_thread_id_unique" UNIQUE("thread_id")
);
--> statement-breakpoint
CREATE TABLE "prefixes" (
	"id" integer NOT NULL,
	"name" text NOT NULL,
	"class" text,
	"category" text NOT NULL,
	"type" text NOT NULL,
	CONSTRAINT "prefixes_id_type_category_pk" PRIMARY KEY("id","type","category")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thread_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"overview" text,
	"hidden_overview" text,
	"original_html" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "thread_details_thread_id_unique" UNIQUE("thread_id")
);
--> statement-breakpoint
CREATE INDEX "timestamp_idx" ON "games" USING btree ("timestamp");