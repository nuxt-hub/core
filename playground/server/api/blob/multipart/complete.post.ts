import { z } from 'zod'

export default eventHandler(async (event) => {
  const { pathname, uploadId } = await getValidatedQuery(event, z.object({
    pathname: z.string().min(1),
    uploadId: z.string().min(1),
  }).parse)

  const { parts } = await readValidatedBody(event,z.object({
    parts: z.array(z.object({
      partNumber: z.number(),
      etag: z.string(),
    }))
  }).parse)

  const { resumeMultipartUpload } = hubBlob()
  const mpu = resumeMultipartUpload(pathname, uploadId)
  try {
    const object = await mpu.complete(parts)
    return object
  } catch (e: any) {
    throw createError({
      statusCode: 400,
      message: e.message
    })
  }
})
