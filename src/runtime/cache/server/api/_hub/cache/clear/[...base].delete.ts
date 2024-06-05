import { eventHandler, sendNoContent, getRouterParam, createError } from 'h3'
import { requireNuxtHubAuthorization } from '../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../utils/features'
// @ts-expect-error useStorage not yet typed
import { useStorage } from '#imports'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('cache')

  const base = getRouterParam(event, 'base') || ''
  if (/\.[a-z0-9]+$/i.test(base)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid base'
    })
  }

  const storage = useStorage(`cache:nitro:${base}`)
  const keys = await storage.getKeys()
  // delete with batch of 25 keys
  do {
    const keysToDelete = keys.splice(0, 25)
    await Promise.all(keysToDelete.map(storage.removeItem))
  } while (keys.length)

  return sendNoContent(event)
})
