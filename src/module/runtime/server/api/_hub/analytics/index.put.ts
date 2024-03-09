import type { AnalyticsEngineDataPoint } from '@cloudflare/workers-types/experimental'
import { eventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'

export default eventHandler(async (event) => {
  const { data } = await readValidatedBody(event, z.object({
    data: z.custom<AnalyticsEngineDataPoint>()
  }).parse)

  await hubAnalytics().put(data)

  return true
})
