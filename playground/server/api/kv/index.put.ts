export default eventHandler(async (event) => {
  const { key, value } = await readValidatedBody(event, z.object({
    key: z.string().min(1).max(100),
    value: z.any()
  }).parse)

  // Set entry for the current user
  await hubKV().setItem(key, value)

  return { key, value }
})
