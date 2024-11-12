import ms from 'ms'
import { eventHandler, getRouterParam } from 'h3'
import { requireNuxtHubAuthorization } from '../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../utils/features'
import { hubCacheBinding } from '../../../utils/cache'
import { useStorage } from '#imports'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('cache')

  const keyOrPrefix = (getRouterParam(event, 'key') || '').replace(/\//g, ':')
  // If ends with an extension
  if (/\.[a-z0-9]{2,5}$/i.test(keyOrPrefix)) {
    const item = await useStorage('cache').getItem(keyOrPrefix)
    if (item) {
      return item
    }
    // Ignore if item is not found, treat the key as a prefix and look for children
  }
  const prefix = `${keyOrPrefix}:`
  const binding = hubCacheBinding()
  const keys = []
  let cursor = undefined
  do {
    const res = await binding.list({ prefix, cursor })

    keys.push(...res.keys)
    cursor = (res.list_complete ? undefined : res.cursor)
  } while (cursor)

  const stats = {
    groups: {} as Record<string, number>,
    cache: [] as any[]
  }

  await Promise.all(keys.map(async ({ name, metadata }) => {
    const key = name.slice(prefix.length)
    if (key.includes(':')) {
      const k = key.split(':')[0]
      stats.groups[k] = (stats.groups[k] || 0) + 1
      return
    }

    // Fallback to read from storage if metadata is not available
    if (!metadata) {
      const item = await useStorage('cache').getItem(name)
      if (!item) return

      metadata = {
        size: JSON.stringify(item).length,
        mtime: item.mtime,
        expires: item.expires
      }
    }

    if (!metadata.expires && metadata.ttl) {
      metadata.expires = metadata.mtime + (metadata.ttl * 1000)
    } else if (metadata.expires) {
      metadata.expires = 'never'
    }
    const entry = {
      key,
      ...metadata
    }
    try {
      entry.duration = ms(metadata.expires - metadata.mtime, { long: true })
    } catch (err) {
      entry.duration = 'never'
    }
    stats.cache.push(entry)
  }))

  return stats
})
