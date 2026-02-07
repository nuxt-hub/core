import { kv } from '@nuxthub/kv'

export default eventHandler(async (event) => {
  const { key, value, ttl } = await readValidatedBody(event, z.object({
    key: z.string().min(1).max(100),
    value: z.any(),
    ttl: z.number().min(60).optional()
  }).parse)

  // Set entry for the current user
  await kv.set(key, value, { ttl })

  return { key, value }
})
