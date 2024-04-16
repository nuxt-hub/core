import { eventHandler, getRouterParam, createError } from 'h3'
import { requireNuxtHubAuthorization } from '../../../utils/auth'
import { requireNuxtHubFeature } from '../../../utils/features'
// @ts-ignore
import { useStorage } from '#imports'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('cache')

  const key = getRouterParam(event, 'key') || ''
  if (!/\.([a-z0-9]+)$/i.test(key)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid key'
    })
  }
  const storage = useStorage('cache:nitro')
  const itemExists = await storage.hasItem(key)
  if (!itemExists) {
    throw createError({
      statusCode: 404,
      message: 'Item not found'
    })
  }
  return await storage.removeItem(key)
})