export default eventHandler(async () => {
  // List todos for the current user
  const db = useDrizzle()
  const todos = await db.select().from(tables.todos)

  return todos
})
