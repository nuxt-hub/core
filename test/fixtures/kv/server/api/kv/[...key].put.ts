import { z } from 'zod'
import { eventHandler, getValidatedRouterParams, readBody } from 'h3'
import { hubKV } from '#imports'

export default eventHandler(async (event) => {
  const { key } = await getValidatedRouterParams(event, z.object({
    key: z.string().min(1)
  }).parse)

  const body = await readBody(event)

  await hubKV().set(key, body)

  return 'OK'
})
