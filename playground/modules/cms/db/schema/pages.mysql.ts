import { mysqlTable, serial, text, timestamp } from 'drizzle-orm/mysql-core'

export const pages = mysqlTable('pages', {
  id: serial().primaryKey(),
  title: text().notNull(),
  body: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})
