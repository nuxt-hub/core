import { blob } from '@nuxthub/blob'

export default eventHandler(async (event) => {
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  const object = await blob.get(pathname)

  if (!object) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Blob not found'
    })
  }

  return object
})
