import { useValidatedBody, z } from 'h3-zod'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { title } = await useValidatedBody(event, {
    title: z.string().min(1).max(100)
  })

  // List todos for the current user
  const todo = await useDatabase().insert(tables.todos).values({
    userId: session.user.id,
    title,
    createdAt: new Date()
  }).returning().get()

  return todo
})