export default defineEventHandler(async () => {
  const hub = useRuntimeConfig().hub
  if (!hub?.db) {
    return { disabled: true }
  }
  if (hub.db.dialect !== 'sqlite') {
    return {
      error: 'SQLite is not enabled'
    }
  }
  const hubDbId = 'hub:' + 'db'
  const { db, schema } = await import(/* @vite-ignore */ hubDbId)
  const { rows } = await db.run(`SELECT name, type FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' and name NOT LIKE '_litestream_%' and name NOT LIKE '__drizzle%';`)

  const todos = await db.select().from(schema.todos).limit(3)

  return {
    drizzleTables: rows,
    todos
  }
})
