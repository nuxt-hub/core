import { mysqlTable, text, int, timestamp } from 'drizzle-orm/mysql-core'

export const todos = mysqlTable('todos', {
  id: int().primaryKey().autoincrement(),
  title: text().notNull(),
  completed: int().notNull().default(0),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})
