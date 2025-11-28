import * as z from 'zod'
import { eventHandler, getValidatedRouterParams, createError } from 'h3'
import { kv } from 'hub:kv'

export default eventHandler(async (event) => {
  const { key } = await getValidatedRouterParams(event, z.object({
    key: z.string().min(1)
  }).parse)

  // Handle the special case for listing keys (key ends with ':')
  if (key === ':') {
    return kv.keys()
  }

  const value = await kv.get(key)
  if (value === null) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Key not found'
    })
  }
  return value
})
