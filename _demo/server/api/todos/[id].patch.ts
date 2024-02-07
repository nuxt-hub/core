import { eq, and } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string().min(0)
  }).parse)
  const { completed } = await readValidatedBody(event, z.object({
    completed: z.number().int().min(0).max(1)
  }).parse)

  // List todos for the current user
  const todo = await useDB().update(tables.todos).set({
    completed
  }).where(and(
    eq(tables.todos.id, Number(id)),
    eq(tables.todos.userId, session.user.id)
  )).returning().get()

  return todo
})
