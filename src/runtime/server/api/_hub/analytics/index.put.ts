import type { AnalyticsEngineDataPoint } from '@cloudflare/workers-types/experimental'
import { eventHandler, readValidatedBody } from 'h3'

export default eventHandler(async (event) => {
  const { data } = await readValidatedBody(event, z.object({
    data: z.custom<AnalyticsEngineDataPoint>()
  }).parse)

  await useAnalytics().put(data)

  return true
})
