import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const pages = pgTable('pages', {
  id: serial().primaryKey(),
  title: text().notNull(),
  body: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})
