import { eventHandler, getValidatedRouterParams, readValidatedBody } from 'h3'
import { z } from 'zod'
import { hubVectorize } from '../../../../server/utils/vectorize'
import { requireNuxtHubAuthorization } from '../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../utils/features'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('vectorize')

  // https://developers.cloudflare.com/vectorize/reference/client-api/
  const { command } = await getValidatedRouterParams(event, z.object({
    command: z.enum(['insert', 'upsert', 'query', 'getByIds', 'deleteByIds', 'describe'])
  }).parse)
  const vectorize = hubVectorize()

  if (command === 'insert' || command === 'upsert') {
    const { vectors } = await readValidatedBody(event, z.object({
      vectors: z.array(z.object({
        id: z.string().min(1).max(256),
        namespace: z.string().min(1).max(63).optional(),
        values: z.array(z.number()),
        metadata: z.record(z.string(), z.any()).optional()
      }))
    }).parse)
    return vectorize[command](vectors)
  }

  if (command === 'query') {
    const { query, params } = await readValidatedBody(event, z.object({
      query: z.array(z.number()),
      params: z.object({
        topK: z.number().optional(),
        namespace: z.string().min(1).max(63).optional(),
        returnValues: z.boolean().optional(),
        returnMetadata: z.boolean().optional(),
        filter: z.record(z.string(), z.any()).optional()
      })
    }).parse)
    return vectorize.query(query, params)
  }

  if (command === 'getByIds' || command === 'deleteByIds') {
    const { ids } = await readValidatedBody(event, z.object({
      ids: z.array(z.string().min(1).max(256))
    }).parse)
    return vectorize[command](ids)
  }

  if (command === 'describe') {
    return vectorize.describe()
  }
})
