export default eventHandler(async (event) => {
  const { key } = await getValidatedRouterParams(event, z.object({
    key: z.string().min(1).max(100)
  }).parse)

  // Delete entry for the current user
  await hubKV().del(key)

  return { key }
})
