import { pages } from 'hub:database:schema'
import { int, mysqlTable, text, timestamp } from 'drizzle-orm/mysql-core'

export { glasses } from '../glasses'

export const comments = mysqlTable('comments', {
  id: int().primaryKey().autoincrement(),
  pageId: int().references(() => pages.id),
  // pageId: int().notNull(),
  content: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})
