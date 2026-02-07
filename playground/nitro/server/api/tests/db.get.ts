import { defineEventHandler, useRuntimeConfig } from '#imports'

export default defineEventHandler(async () => {
  const hub = useRuntimeConfig().hub
  if (!hub?.db) {
    return { disabled: true }
  }
  if (hub.db.dialect !== 'sqlite') {
    return { error: 'SQLite is not enabled', dialect: hub.db.dialect }
  }

  const hubDbId = 'hub:' + 'db'
  const { db, schema } = await import(/* @vite-ignore */ hubDbId)

  await db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL DEFAULT (unixepoch())
  )`)

  const todos = await db.select().from(schema.todos).limit(5)

  return { todos }
})
