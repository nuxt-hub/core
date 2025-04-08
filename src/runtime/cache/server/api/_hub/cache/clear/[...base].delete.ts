import { eventHandler, sendNoContent, getRouterParam, createError, getHeader } from 'h3'
import { requireNuxtHubAuthorization } from '../../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../../utils/features'
import { useStorage, useRuntimeConfig } from '#imports'

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

  const storage = useStorage(`cache:${base}`)
  const keys = await storage.getKeys()
  const hub = useRuntimeConfig(event).hub
  if (import.meta.dev) {
    // delete with batch of 100 keys
    do {
      const keysToDelete = keys.splice(0, 100)
      await Promise.all(keysToDelete.map(storage.removeItem))
    } while (keys.length)
  } else {
    await $fetch(`/api/projects/${process.env.NUXT_HUB_PROJECT_KEY || hub.projectKey}/cache/${process.env.NUXT_HUB_ENV || hub.env}/batch-delete`, {
      baseURL: process.env.NUXT_HUB_URL || hub.url,
      method: 'POST',
      body: {
        keys: keys.map(key => `${base}:${key}`)
      },
      headers: new Headers({
        authorization: getHeader(event, 'authorization') || ''
      })
    })
  }

  return sendNoContent(event)
})
