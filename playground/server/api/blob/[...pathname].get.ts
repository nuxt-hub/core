export default eventHandler(async (event) => {
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)
  setHeader(event, 'Content-Security-Policy', 'default-src \'none\';')
  return hubBlob().serve(event, pathname)
})
