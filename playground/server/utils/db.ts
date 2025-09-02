import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
// import { pgTable, text as pgText, boolean as pgBoolean, serial as pgSerial, timestamp as pgTimestamp } from 'drizzle-orm/pg-core'

import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
// import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
// import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
// import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres'

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

export async function useDrizzle() {
  const database = hubDatabase()
  const instance = await database.getInstance()

  if (import.meta.dev) {
    return drizzleSqlite(instance, { schema: tables })
  }

  return drizzleSqlite(instance, { schema: tables })
}
