export default eventHandler(async (event) => {
  await requireUserSession(event)
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  return useBlob().delete(pathname)
})
