import { createError, eventHandler, getValidatedQuery, readValidatedBody } from 'h3'
import { z } from 'zod'
import { hubBlob } from '../../../../../utils/blob'
import { requireNuxtHubAuthorization } from '../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../utils/features'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('blob')

  const { pathname, uploadId } = await getValidatedQuery(event, z.object({
    pathname: z.string().min(1),
    uploadId: z.string().min(1)
  }).parse)

  const { parts } = await readValidatedBody(event, z.object({
    parts: z.array(z.object({
      partNumber: z.number(),
      etag: z.string()
    }))
  }).parse)

  const { resumeMultipartUpload } = hubBlob()
  const { complete } = resumeMultipartUpload(pathname, uploadId)
  try {
    const object = await complete(parts)
    return object
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      message: `Storage error: ${e.message}`
    })
  }
})
