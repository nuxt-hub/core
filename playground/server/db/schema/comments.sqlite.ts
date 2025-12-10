import { pages } from 'hub:db:schema'
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const comments = sqliteTable('comments', {
  id: integer().primaryKey(),
  // @ts-expect-error - ignore as it depends of current dialect
  pageId: integer().references(() => pages.id),
  content: text().notNull(),
  createdAt: integer({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
})
