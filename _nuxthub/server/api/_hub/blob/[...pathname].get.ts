export default eventHandler(async (event) => {
  // TODO: handle authorization
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  return useBlob().serve(event, pathname)
})
