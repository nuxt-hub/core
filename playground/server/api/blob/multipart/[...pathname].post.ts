import { z } from 'zod'

export default eventHandler(async (event) => {
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  const options = await readValidatedBody(event, z.record(z.string(), z.any()).optional().parse)

  const { createMultipartUpload } = hubBlob()
  try {
    const object = await createMultipartUpload(pathname, options)
    return {
      uploadId: object.uploadId,
      pathname: object.pathname,
    }
  } catch (e: any) {
    throw createError({
      statusCode: 400,
      message: e.message
    })
  }
})
