import ms from 'ms'
import { eventHandler, getRouterParam } from 'h3'
import { requireNuxtHubAuthorization } from '../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../utils/features'
// @ts-expect-error useStorage not yet typed
import { useStorage } from '#imports'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('cache')

  const key = getRouterParam(event, 'key') || ''
  // If ends with an extension
  if (/\.[a-z0-9]{2,5}$/i.test(key)) {
    const item = await useStorage('cache').getItem(key)
    if (item) {
      return item
    }
    // Ignore if item is not found, treat the key as a prefix and look for children
  }
  const storage = useStorage(`cache:${key}`)
  const keys = await storage.getKeys()

  const stats = {
    groups: {} as Record<string, number>,
    cache: [] as any[]
  }

  await Promise.all(keys.map(async (key: string) => {
    if (key.includes(':')) {
      const k = key.split(':')[0]
      stats.groups[k] = (stats.groups[k] || 0) + 1
      return
    }
    const item = await storage.getItem(key)
    if (!item) return
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { value, ...meta } = item

    const entry = {
      key,
      ...meta,
      size: JSON.stringify(item).length
    }
    try {
      entry.duration = ms(meta.expires - meta.mtime, { long: true })
    } catch (err) {
      entry.duration = 'unknown'
    }
    stats.cache.push(entry)
  }))

  return stats
})
