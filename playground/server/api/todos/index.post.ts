export default eventHandler(async (event) => {
  const { title } = await readValidatedBody(event, z.object({
    title: z.string().min(1).max(100)
  }).parse)

  // List todos for the current user
  const db = await useDrizzle()
  const todo = await db.insert(tables.todos).values({
    title,
    createdAt: new Date()
  }).returning().then(r => r[0])

  return todo
})
