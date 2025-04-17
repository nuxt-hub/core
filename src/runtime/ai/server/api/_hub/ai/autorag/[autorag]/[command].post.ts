import { eventHandler, getValidatedRouterParams, readValidatedBody } from 'h3'
import { z } from 'zod'
import { hubAutoRAG } from '../../../../../utils/autorag'
import { requireNuxtHubAuthorization } from '../../../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../../../utils/features'

const SearchSchema = z.object({
  query: z.string().min(1).max(1e6).trim()
}).and(
  z.record(z.string(), z.unknown())
)

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('ai')

  // https://developers.cloudflare.com/autorag/usage/workers-binding/
  const { autorag: instance, command } = await getValidatedRouterParams(event, z.object({
    command: z.enum(['ai-search', 'search']),
    autorag: z.string()
  }).parse)
  const autorag = hubAutoRAG(instance)

  if (command === 'ai-search') {
    const params = await readValidatedBody(event, SearchSchema.parse)
    return await autorag.aiSearch(params)
  }

  if (command === 'search') {
    const params = await readValidatedBody(event, SearchSchema.parse)
    return await autorag.search(params)
  }
})
