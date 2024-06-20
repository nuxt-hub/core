import { eventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'
import { hubVectorize } from '../../../server/utils/vectorize'
import { requireNuxtHubAuthorization } from '../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../utils/features'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('vectorize')

  const { query, params } = await readValidatedBody(event, z.object({
    query: z.array(z.number()),
    params: z.object({
      topK: z.number().optional(),
      namespace: z.string().optional(),
      returnValues: z.boolean().optional(),
      returnMetadata: z.boolean().optional(),
      filter: z.record(z.string(), z.any()).optional()
    })
  }).parse)
  return hubVectorize().query(query, params)
})
