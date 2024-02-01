export default eventHandler(async (event) => {
  await requireUserSession(event)
  const { key, value } = await readValidatedBody(event, z.object({
    key: z.string().min(1).max(100),
    value: z.any()
  }).parse)

  // Set entry for the current user
  const storage = await useKV()

  await storage.setItem(key, value)

  return { key, value }
})
