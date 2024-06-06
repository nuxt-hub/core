import type { AnalyticsEngineDataPoint } from '@cloudflare/workers-types/experimental'
import { eventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'
import { hubAnalytics } from '../../../utils/analytics'
import { requireNuxtHubAuthorization } from '../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../utils/features'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('analytics')

  const { data } = await readValidatedBody(event, z.object({
    data: z.custom<AnalyticsEngineDataPoint>()
  }).parse)

  await hubAnalytics().put(data)

  return true
})
