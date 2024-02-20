import { eq, and } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string().min(1)
  }).parse)

  // List todos for the current user
  const deletedTodo = await useDB().delete(tables.todos).where(and(
    eq(tables.todos.id, Number(id))
  )).returning().get()

  if (!deletedTodo) {
    throw createError({
      statusCode: 404,
      message: 'Todo not found'
    })
  }
  return deletedTodo
})
