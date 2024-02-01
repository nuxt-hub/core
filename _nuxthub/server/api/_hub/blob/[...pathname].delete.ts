export default eventHandler(async (event) => {
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  await useBlob().delete(pathname)

  return setResponseStatus(event, 204)
})
