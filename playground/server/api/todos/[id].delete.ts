import { eq, and } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default eventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string().min(1)
  }).parse)

  // List todos for the current user
  const deletedTodo = await db.delete(schema.todos).where(and(
    eq(schema.todos.id, Number(id))
  )).returning().then(r => r[0])

  if (!deletedTodo) {
    throw createError({
      statusCode: 404,
      message: 'Todo not found'
    })
  }
  return deletedTodo
})
