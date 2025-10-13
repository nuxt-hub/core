import * as z from 'zod'
import { eventHandler, getValidatedRouterParams, createError } from 'h3'
import { hubKV } from '#imports'

export default eventHandler(async (event) => {
  const { key } = await getValidatedRouterParams(event, z.object({
    key: z.string().min(1)
  }).parse)

  // Handle the special case for listing keys (key ends with ':')
  if (key === ':') {
    return hubKV().keys()
  }

  const value = await hubKV().get(key)
  if (value === null) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Key not found'
    })
  }
  return value
})
