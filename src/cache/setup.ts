import { join } from 'pathe'
import { defu } from 'defu'
import { logWhenReady, addWranglerBinding } from '../utils'

import type { Nuxt } from '@nuxt/schema'
import type { HubConfig, CacheConfig, ResolvedCacheConfig } from '@nuxthub/core'

/**
 * Resolve cache configuration from boolean or object format
 */
export function resolveCacheConfig(hub: HubConfig): ResolvedCacheConfig | false {
  if (!hub.cache) return false

  // Start with user-provided config if it's an object
  const userConfig = typeof hub.cache === 'object' ? hub.cache : {} as CacheConfig

  // If driver is already specified by user, use it with their options
  if (userConfig.driver) {
    if (userConfig.driver === 'cloudflare-kv-binding') {
      return defu(userConfig, { binding: 'CACHE' }) as ResolvedCacheConfig
    }
    return userConfig as ResolvedCacheConfig
  }

  // Cloudflare KV cache binding
  if (hub.hosting.includes('cloudflare')) {
    return defu(userConfig, {
      driver: 'cloudflare-kv-binding',
      binding: 'CACHE'
    }) as ResolvedCacheConfig
  }

  // Vercel runtime cache
  if (hub.hosting.includes('vercel')) {
    return defu(userConfig, {
      driver: 'vercel-runtime-cache'
    }) as ResolvedCacheConfig
  }

  // Default: file system storage for development
  return defu(userConfig, {
    driver: 'fs-lite',
    base: join(hub.dir!, 'cache')
  }) as ResolvedCacheConfig
}

export async function setupCache(nuxt: Nuxt, hub: HubConfig, _deps: Record<string, string>) {
  hub.cache = resolveCacheConfig(hub)
  if (!hub.cache) return

  const cacheConfig = hub.cache as ResolvedCacheConfig

  if (cacheConfig.driver === 'cloudflare-kv-binding' && cacheConfig.namespaceId) {
    addWranglerBinding(nuxt, 'kv_namespaces', { binding: cacheConfig.binding || 'CACHE', id: cacheConfig.namespaceId })
  }

  // Configure storage
  const { namespaceId: _namespaceId, ...cacheStorageConfig } = cacheConfig
  nuxt.options.nitro.storage ||= {}
  nuxt.options.nitro.storage.cache = defu(nuxt.options.nitro.storage.cache, cacheStorageConfig)

  // Also set devStorage for development mode (fs-lite driver)
  if (nuxt.options.dev) {
    nuxt.options.nitro.devStorage ||= {}
    nuxt.options.nitro.devStorage.cache = defu(nuxt.options.nitro.devStorage.cache, cacheStorageConfig)
  }

  logWhenReady(nuxt, `\`hub:cache\` using \`${cacheConfig.driver.split('/').pop()}\` driver`)
}
