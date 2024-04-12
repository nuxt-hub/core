import { z } from 'zod'

async function streamToArrayBuffer(stream: ReadableStream, streamSize: number) {
  const result = new Uint8Array(streamSize)
  let bytesRead = 0
  const reader = stream.getReader()
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    result.set(value, bytesRead)
    bytesRead += value.length
  }
  return result
}

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


  const hub = hubBlob()
  const mpu = hub.resumeMultipartUpload(pathname, uploadId)

  try {
    return await mpu.uploadPart(partNumber, body)
  } catch (e: any) {
    throw createError({ status: 400, message: e.message })
  }
})
