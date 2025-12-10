import { pages } from 'hub:db:schema'
import { pgTable, text, timestamp, serial } from 'drizzle-orm/pg-core'

export { glasses } from '../glasses'

export const comments = pgTable('comments', {
  id: serial().primaryKey(),
  pageId: serial().references(() => pages.id),
  content: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})
