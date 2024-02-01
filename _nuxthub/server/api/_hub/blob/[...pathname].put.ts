export default eventHandler(async (event) => {
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)
  const query = getQuery(event)

  const contentType = getHeader(event, 'content-type')
  const contentLength = Number(getHeader(event, 'content-length') || '0')

  const options = { ...query }
  if (!options.contentType) { options.contentType = contentType }
  if (!options.contentLength) { options.contentLength = contentLength }

  const body = getRequestWebStream(event)!

  return useBlob().put(pathname, body, options)
})
