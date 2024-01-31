export default eventHandler(async (event) => {
  // TODO: handle authorization

  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  const blob = await useBlob().head(pathname)

  setHeader(event, 'x-blob', JSON.stringify(blob))

  return setResponseStatus(event, 204)
})
