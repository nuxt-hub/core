import * as d from 'drizzle-orm/pg-core'

export const todos = d.snakeCase.table('todos', {
  id: d.serial().primaryKey(),
  title: d.text().notNull(),
  completed: d.integer().notNull().default(0),
  createdAt: d.timestamp().notNull().defaultNow(),
  updatedAt: d.timestamp().notNull().defaultNow()
})
