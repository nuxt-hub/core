export default eventHandler(async (event) => {
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  const blob = await hubBlob().get(pathname)

  console.log('blob', blob)

  if (!blob) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Blob not found'
    })
  }

  return blob
})
