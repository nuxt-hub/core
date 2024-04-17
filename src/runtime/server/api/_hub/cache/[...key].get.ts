import ms from 'ms'
import { eventHandler, getRouterParam } from 'h3'
import { requireNuxtHubAuthorization } from '../../../utils/auth'
import { requireNuxtHubFeature } from '../../../utils/features'
// @ts-ignore
import { useStorage } from '#imports'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('cache')

  const key = getRouterParam(event, 'key') || ''
  // If ends with an extension
  if (/\.([a-z0-9]+)$/i.test(key)) {
    return await useStorage('cache:nitro').getItem(key)
  }
  const storage = useStorage(`cache:nitro:${key}`)
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
    const { value, ...meta } = item

    const entry: any = {
      key,
      ...meta,
      size: JSON.stringify(item).length
    }
    try {
      entry.duration = ms(item.expires - item.mtime, { long: true })
    } catch (err) {
      entry.duration = 'unknown'
      console.log('Cannot have ms duration', key, err)
    }
    stats.cache.push(entry)
  }))

  return stats
})