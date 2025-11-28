import { db, schema } from 'hub:db'

export default defineEventHandler(async () => {
  if (useRuntimeConfig().hub.db.dialect !== 'sqlite') {
    return {
      error: 'SQLite is not enabled'
    }
  }
  const { rows } = await db.run(`SELECT name, type FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' and name NOT LIKE '_litestream_%' and name NOT LIKE '__drizzle%';`)

  const todos = await db.select().from(schema.todos).limit(3)

  return {
    drizzleTables: rows,
    todos
  }
})
