import { int, mysqlTable, text, timestamp } from 'drizzle-orm/mysql-core'

export const pages = mysqlTable('pages', {
  id: int().primaryKey(),
  title: text().notNull(),
  body: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})
