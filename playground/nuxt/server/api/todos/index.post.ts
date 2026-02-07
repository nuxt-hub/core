export default eventHandler(async (event) => {
  const hub = useRuntimeConfig().hub
  if (!hub?.db) {
    return { disabled: true }
  }

  const { title } = await readValidatedBody(event, z.object({
    title: z.string().min(1).max(100)
  }).parse)

  const hubDbId = 'hub:' + 'db'
  const { db, schema } = await import(/* @vite-ignore */ hubDbId)

  // List todos for the current user
  const todo = await db.insert(schema.todos).values({
    title,
    createdAt: new Date()
  }).returning().then(r => r[0])

  return todo
})
