// import { pages } from 'hub:database:schema'
import { integer, pgTable, text, timestamp, serial } from 'drizzle-orm/pg-core'

export const comments = pgTable('comments', {
  id: serial().primaryKey(),
  // pageId: integer().references(() => pages.id),
  pageId: integer().notNull(),
  content: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})
