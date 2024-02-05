export default eventHandler(async (event) => {
  await requireUserSession(event)

  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string()
  }).parse)

  return useBlob().head(pathname)
})
