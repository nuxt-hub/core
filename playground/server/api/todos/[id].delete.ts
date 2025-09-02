import { eq, and } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string().min(1)
  }).parse)

  // List todos for the current user
  const db = await useDrizzle()
  const deletedTodo = await db.delete(tables.todos).where(and(
    eq(tables.todos.id, Number(id))
  )).returning().then(r => r[0])

  if (!deletedTodo) {
    throw createError({
      statusCode: 404,
      message: 'Todo not found'
    })
  }
  return deletedTodo
})
