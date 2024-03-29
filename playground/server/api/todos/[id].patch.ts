import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string().min(0)
  }).parse)
  const { completed } = await readValidatedBody(event, z.object({
    completed: z.number().int().min(0).max(1)
  }).parse)

  // List todos for the current user
  const todo = await useDrizzle().update(tables.todos).set({
    completed
  }).where(eq(tables.todos.id, Number(id))).returning().get()

  return todo
})
