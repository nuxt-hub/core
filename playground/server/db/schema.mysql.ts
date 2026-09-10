import * as d from 'drizzle-orm/mysql-core'

export const todos = d.snakeCase.table('todos', {
  id: d.int().primaryKey().autoincrement(),
  title: d.text().notNull(),
  completed: d.int().notNull().default(0),
  createdAt: d.timestamp().notNull().defaultNow(),
  updatedAt: d.timestamp().notNull().defaultNow()
})
