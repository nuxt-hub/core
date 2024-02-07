import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)

  // List todos for the current user
  const todos = await useDB().select().from(tables.todos).where(eq(tables.todos.userId, session.user.id)).all()

  return todos
})
