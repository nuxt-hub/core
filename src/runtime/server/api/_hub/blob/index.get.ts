import { eventHandler, getValidatedQuery } from 'h3'
import { z } from 'zod'
import { hubBlob } from '../../../utils/blob'
import { requireNuxtHubAuthorization } from '../../../utils/auth'
import { requireNuxtHubFeature } from '../../../utils/features'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('blob')

  const listOptions = await getValidatedQuery(event, z.object({
    folded: z.string().toLowerCase().transform(x => x === 'true').optional(),
    limit: z.string().transform(x => Number.parseInt(x)).optional(),
    prefix: z.string().optional(),
    cursor: z.string().optional()
  }).parse)

  return hubBlob().list(listOptions)
})
