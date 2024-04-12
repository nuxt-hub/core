import { z } from 'zod'

export default eventHandler(async (event) => {
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  const { uploadId } = await getValidatedQuery(event, z.object({
    uploadId: z.string(),
  }).parse)

  const { resumeMultipartUpload } = hubBlob()
  const mpu = resumeMultipartUpload(pathname, uploadId)

  try {
    await mpu.abort()
  }
  catch (e: any) {
    throw createError({ status: 400, message: e.message })
  }

  return sendNoContent(event)
})
