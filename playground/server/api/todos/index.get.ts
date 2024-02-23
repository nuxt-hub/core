export default eventHandler(async () => {
  // List todos for the current user
  const todos = await useDrizzle().select().from(tables.todos).all()

  return todos
})
