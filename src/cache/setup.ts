import { defu } from 'defu'
import { logWhenReady, addWranglerBinding } from '../utils'
import { resolveCacheConfig } from './resolve'

import type { Nuxt } from '@nuxt/schema'
import type { HubConfig, ResolvedCacheConfig } from '@nuxthub/core'

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
