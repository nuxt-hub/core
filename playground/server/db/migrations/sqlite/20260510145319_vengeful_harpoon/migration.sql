CREATE TABLE `author` (
	`id` integer PRIMARY KEY,
	`name` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `todos` RENAME COLUMN `createdAt` TO `created_at`;--> statement-breakpoint
ALTER TABLE `comments` ADD `authorId` integer REFERENCES author(id);