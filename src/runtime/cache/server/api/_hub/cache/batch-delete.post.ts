import { eventHandler, readValidatedBody, sendNoContent, getHeader } from 'h3'
import { z } from 'zod'
import { requireNuxtHubAuthorization } from '../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../utils/features'
import { useStorage, useRuntimeConfig } from '#imports'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('cache')

  const { keys } = await readValidatedBody(event, z.object({
    keys: z.array(z.string().min(1)).min(1)
  }).parse)

  const storage = useStorage('cache')
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
      body: { keys },
      headers: {
        authorization: getHeader(event, 'authorization')
      }
    })
  }
  return sendNoContent(event)
})
