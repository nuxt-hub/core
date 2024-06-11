import { eventHandler } from 'h3'
import { requireNuxtHubAuthorization } from '../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../utils/features'
// @ts-expect-error (No types for #imports)
import { useStorage } from '#imports'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('cache')

  const cache = await useStorage('cache:nitro').getKeys()

  const stats: Record<string, number> = {
    handlers: 0,
    functions: 0
  }

  for (const key of cache) {
    if (!key.includes(':')) continue
    const [group] = key.split(':')

    stats[group] = (stats[group] || 0) + 1
  }

  return stats
})
