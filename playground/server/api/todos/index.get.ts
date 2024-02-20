export default eventHandler(async () => {
  // List todos for the current user
  const todos = await useDB().select().from(tables.todos).all()

  return todos
})
