CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` int NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `todos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`completed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `todos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_pageId_pages_id_fk` FOREIGN KEY (`pageId`) REFERENCES `pages`(`id`) ON DELETE no action ON UPDATE no action;