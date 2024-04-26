import { eventHandler, getValidatedRouterParams, getHeader, getRequestWebStream, getValidatedQuery } from 'h3'
import { z } from 'zod'
import { hubBlob } from '../../../../utils/blob'
import { requireNuxtHubAuthorization } from '../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../utils/features'
import { streamToArrayBuffer } from '../../../../internal/utils/stream'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('blob')

  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  const { uploadId, partNumber } = await getValidatedQuery(event, z.object({
    uploadId: z.string(),
    partNumber: z.coerce.number()
  }).parse)

  const contentLength = Number(getHeader(event, 'content-length') || '0')

  const stream = getRequestWebStream(event)!
  const body = await streamToArrayBuffer(stream, contentLength)

  const { resumeMultipartUpload } = hubBlob()
  const { uploadPart } = resumeMultipartUpload(pathname, uploadId)

  try {
    return await uploadPart(partNumber, body)
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      message: `Storage error: ${e.message}`
    })
  }
})
