// import { pages } from 'hub:database:schema'
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const comments = sqliteTable('comments', {
  id: integer().primaryKey(),
  // pageId: integer().references(() => pages.id),
  pageId: integer().notNull(),
  content: text().notNull(),
  createdAt: integer({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
})
