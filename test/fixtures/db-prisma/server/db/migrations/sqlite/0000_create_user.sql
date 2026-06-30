CREATE TABLE IF NOT EXISTS `User` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS `User_email_unique` ON `User` (`email`);
