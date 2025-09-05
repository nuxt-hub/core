import { z } from 'zod'
import { eventHandler, getValidatedRouterParams } from 'h3'
import { hubKV } from '#imports'

export default eventHandler(async (event) => {
  const { key } = await getValidatedRouterParams(event, z.object({
    key: z.string().min(1)
  }).parse)

  await hubKV().del(key)

  return 'OK'
})
