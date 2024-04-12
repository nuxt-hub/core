import { createError, eventHandler } from 'h3'
import { z } from 'zod'
import { hubBlob } from '../../../../utils/blob'
import { requireNuxtHubAuthorization } from '../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../utils/features'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('blob')

  const query = await getValidatedQuery(event, z.discriminatedUnion('action', [
    z.object({
      action: z.literal('create'),
      pathname: z.string(),
    }),
    z.object({
      action: z.literal('complete'),
      pathname: z.string(),
      uploadId: z.string(),
    }),
  ]).parse)

  if (query.action === 'create') {
    const options = await readValidatedBody(event, z.record(z.string(), z.any()).optional().parse)

    const blob = hubBlob()

    try {
      const object = await blob.createMultipartUpload(query.pathname, options)
      return object
    } catch (e: any) {
      throw createError({
        statusCode: 500,
        message: `Storage error: ${e.message}`
      })
    }
  } else {
    const { uploadId, pathname } = query
    const { parts } = await readValidatedBody(event,z.object({
      parts: z.array(z.object({
        partNumber: z.number(),
        etag: z.string(),
      }))
    }).parse)

    const blob = hubBlob()

    const mpu = blob.resumeMultipartUpload(pathname, uploadId)
    try {
      const object = await mpu.complete(parts)
      return object
    } catch (e: any) {
      throw createError({
        statusCode: 500,
        message: `Storage error: ${e.message}`
      })
    }
  }
})
