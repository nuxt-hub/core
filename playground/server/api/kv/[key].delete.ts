import { kv } from 'hub:kv'

export default eventHandler(async (event) => {
  const { key } = await getValidatedRouterParams(event, z.object({
    key: z.string().min(1).max(100)
  }).parse)

  // Delete entry for the current user
  await kv.del(key)

  return { key }
})
