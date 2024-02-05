export default eventHandler(async (event) => {
  await requireUserSession(event)
  const { key } = await getValidatedRouterParams(event, z.object({
    key: z.string().min(1)
  }).parse)

  return useBlob().serve(event, key)
})
