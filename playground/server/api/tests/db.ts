export default defineEventHandler(async () => {
  if (useRuntimeConfig().hub.database.dialect !== 'sqlite') {
    return {
      error: 'SQLite is not enabled'
    }
  }
  const db = useDrizzle()

  const { rows } = await db.run(`SELECT name, type FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' and name NOT LIKE '_litestream_%' and name NOT LIKE '__drizzle%';`)

  const todos = await db.select().from(tables.todos).limit(3)

  return {
    drizzleTables: rows,
    todos
  }
})
