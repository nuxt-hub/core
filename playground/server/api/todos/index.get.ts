import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  // List todos for the current user
  const todos = await useDB().select().from(tables.todos).all()

  return todos
})
