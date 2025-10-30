import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const pages = pgTable('pages', {
  id: integer().primaryKey(),
  title: text().notNull(),
  body: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
})
