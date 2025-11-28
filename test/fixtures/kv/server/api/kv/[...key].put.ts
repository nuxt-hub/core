import * as z from 'zod'
import { eventHandler, getValidatedRouterParams, readBody } from 'h3'
import { kv } from 'hub:kv'

export default eventHandler(async (event) => {
  const { key } = await getValidatedRouterParams(event, z.object({
    key: z.string().min(1)
  }).parse)

  const body = await readBody(event)

  await kv.set(key, body)

  return 'OK'
})
