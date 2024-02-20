export default eventHandler(async (event) => {
  const { title } = await readValidatedBody(event, z.object({
    title: z.string().min(1).max(100)
  }).parse)

  // List todos for the current user
  const todo = await useDB().insert(tables.todos).values({
    title,
    createdAt: new Date()
  }).returning().get()

  return todo
})
