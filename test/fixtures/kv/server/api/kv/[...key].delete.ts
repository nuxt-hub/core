import * as z from 'zod'
import { eventHandler, getValidatedRouterParams } from 'h3'
import { kv } from 'hub:kv'

export default eventHandler(async (event) => {
  const { key } = await getValidatedRouterParams(event, z.object({
    key: z.string().min(1)
  }).parse)

  await kv.del(key)

  return 'OK'
})
