import { eventHandler, getRouterParam, createError, sendNoContent } from 'h3'
import { requireNuxtHubAuthorization } from '../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../utils/features'
import { useStorage } from '#imports'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('cache')

  const key = getRouterParam(event, 'key') || ''
  if (!/\.[a-z0-9]+$/i.test(key)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid key'
    })
  }
  const storage = useStorage('cache')
  await storage.removeItem(key)

  return sendNoContent(event)
})
