import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
// import { pgTable, text as pgText, boolean as pgBoolean, serial as pgSerial, timestamp as pgTimestamp } from 'drizzle-orm/pg-core'
import { drizzle } from '#hub/database'

export { sql } from 'drizzle-orm'

const todos = sqliteTable('todos', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  completed: integer('completed').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

// const todos = pgTable('todos', {
//   id: pgSerial('id').primaryKey(),
//   title: pgText('title').notNull(),
//   completed: pgBoolean('completed').notNull().default(false),
//   createdAt: pgTimestamp('created_at').notNull()
// })

export const tables = {
  todos
}

export function useDrizzle() {
  return drizzle({ schema: tables })
}
