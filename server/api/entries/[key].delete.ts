export default eventHandler(async (event) => {
  await requireUserSession(event)
  const { key } = await getValidatedRouterParams(event, z.object({
    key: z.string().min(1).max(100)
  }).parse)

  // Delete entry for the current user
  const storage = await useKV()

  await storage.removeItem(key)

  return { key }
})
