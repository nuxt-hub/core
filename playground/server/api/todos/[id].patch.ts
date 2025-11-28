import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string().min(0)
  }).parse)
  const { completed } = await readValidatedBody(event, z.object({
    completed: z.number().int().min(0).max(1)
  }).parse)

  // List todos for the current user
  const todo = await db.update(schema.todos).set({
    completed
  }).where(eq(schema.todos.id, Number(id))).returning().then(r => r[0])

  return todo
})
