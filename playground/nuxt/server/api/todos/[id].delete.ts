import { eq, and } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const hub = useRuntimeConfig().hub
  if (!hub?.db) {
    return { disabled: true }
  }

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string().min(1)
  }).parse)

  const hubDbId = 'hub:' + 'db'
  const { db, schema } = await import(/* @vite-ignore */ hubDbId)

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
