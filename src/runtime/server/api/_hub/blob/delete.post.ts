import { eventHandler, readValidatedBody, sendNoContent } from 'h3'
import { z } from 'zod'
import { hubBlob } from '../../../utils/blob'
import { requireNuxtHubAuthorization } from '../../../utils/auth'
import { requireNuxtHubFeature } from '../../../utils/features'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('blob')
  
  const { pathnames } = await readValidatedBody(event, z.object({
    pathnames: z.array(z.string().min(1)).min(1)
  }).parse)

  await hubBlob().delete(pathnames)

  return sendNoContent(event)
})
