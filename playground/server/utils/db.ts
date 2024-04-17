import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { drizzle } from 'drizzle-orm/d1'

export { sql } from 'drizzle-orm'

const todos = sqliteTable('todos', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  completed: integer('completed').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export const tables = {
  todos
}

export function useDrizzle() {
  return drizzle(hubDatabase(), { schema: tables })
}
