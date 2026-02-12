import { db, schema } from 'hub:db'

export default defineEventHandler(async () => {
  if (useRuntimeConfig().hub.db.dialect !== 'sqlite') {
    return {
      error: 'SQLite is not enabled'
    }
  }

  await db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL DEFAULT (unixepoch())
  )`)

  const todos = await db.select().from(schema.todos).limit(5)

  return {
    todos
  }
})
