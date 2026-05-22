import { sql } from 'drizzle-orm'
import * as d from 'drizzle-orm/sqlite-core'

export const todos = d.snakeCase.table('todos', {
  id: d.integer().primaryKey({ autoIncrement: true }),
  title: d.text().notNull(),
  completed: d.integer({ mode: 'boolean' }).notNull().default(false),
  createdAt: d.integer({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
})
