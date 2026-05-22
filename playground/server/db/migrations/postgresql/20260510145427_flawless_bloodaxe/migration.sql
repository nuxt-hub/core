CREATE TABLE "author" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "todos" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "todos" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "authorId" serial;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_author_id_fkey" FOREIGN KEY ("authorId") REFERENCES "author"("id");