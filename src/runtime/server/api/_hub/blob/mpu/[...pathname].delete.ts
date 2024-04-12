import { createError, eventHandler } from 'h3'
import { z } from 'zod'
import { hubBlob } from '../../../../utils/blob'
import { requireNuxtHubAuthorization } from '../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../utils/features'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('blob')

  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  const { uploadId } = await getValidatedQuery(event, z.object({
    uploadId: z.string(),
  }).parse)


  const blob = hubBlob()
  const mpu = blob.resumeMultipartUpload(pathname, uploadId)

  try {
    await mpu.abort()
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      message: `Storage error: ${e.message}`
    })
  }
})
