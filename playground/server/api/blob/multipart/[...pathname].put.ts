import { z } from 'zod'

export default eventHandler(async (event) => {
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  const { uploadId, partNumber } = await getValidatedQuery(event, z.object({
    uploadId: z.string(),
    partNumber: z.coerce.number(),
  }).parse)

  const contentLength = Number(getHeader(event, 'content-length') || '0')

  const stream = getRequestWebStream(event)!
  const body = await streamToArrayBuffer(stream, contentLength)


  const { resumeMultipartUpload } = hubBlob()
  const mpu = resumeMultipartUpload(pathname, uploadId)

  try {
    return await mpu.uploadPart(partNumber, body)
  } catch (e: any) {
    throw createError({ status: 400, message: e.message })
  }
})
