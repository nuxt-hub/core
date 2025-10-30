import { pgTable, text, integer, timestamp, serial } from 'drizzle-orm/pg-core'

export const todos = pgTable('todos', {
  id: serial().primaryKey(),
  title: text().notNull(),
  completed: integer().notNull().default(0),
  createdAt: timestamp().notNull().defaultNow()
})
