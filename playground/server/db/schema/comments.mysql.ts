import { pages } from 'hub:db:schema'
import { int, mysqlTable, text, timestamp } from 'drizzle-orm/mysql-core'

export { glasses } from '../glasses'

export const comments = mysqlTable('comments', {
  id: int().primaryKey().autoincrement(),
  // @ts-expect-error - ignore as it depends of current dialect
  pageId: int().references(() => pages.id),
  content: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})
