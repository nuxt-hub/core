CREATE TABLE "glasses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "pageId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_pageId_pages_id_fk" FOREIGN KEY ("pageId") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;