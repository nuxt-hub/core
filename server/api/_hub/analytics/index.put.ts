import type { AnalyticsEngineDataPoint } from '@cloudflare/workers-types/experimental'

export default eventHandler(async (event) => {
  const { data } = await readValidatedBody(event, z.object({
    data: z.custom<AnalyticsEngineDataPoint>()
  }).parse)

  await useAnalytics().put(data)

  return true
})
