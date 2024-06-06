import { createError, eventHandler, getValidatedRouterParams, readValidatedBody } from 'h3'
import { z } from 'zod'
import { hubBlob } from '../../../../../utils/blob'
import { requireNuxtHubAuthorization } from '../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../utils/features'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('blob')

  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  const options = await readValidatedBody(event, z.record(z.string(), z.any()).optional().parse)

  const { createMultipartUpload } = hubBlob()
  try {
    const object = await createMultipartUpload(pathname, options)
    return {
      uploadId: object.uploadId,
      pathname: object.pathname
    }
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      message: `Storage error: ${e.message}`
    })
  }
})
