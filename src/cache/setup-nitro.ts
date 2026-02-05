import { defu } from 'defu'
import type { Nitro } from 'nitropack/types'
import type { HubConfig, ResolvedCacheConfig } from '@nuxthub/core'
import { addWranglerBindingNitro } from '../utils-nitro'
import { resolveCacheConfig } from './setup'

export async function setupCacheNitro(nitro: Nitro, hub: HubConfig, _deps: Record<string, string>) {
  hub.cache = resolveCacheConfig(hub)
  if (!hub.cache) return

  const cacheConfig = hub.cache as ResolvedCacheConfig
  const log = nitro.logger.withTag('nitro:hub')

  if (cacheConfig.driver === 'cloudflare-kv-binding' && cacheConfig.namespaceId) {
    addWranglerBindingNitro(nitro, 'kv_namespaces', { binding: cacheConfig.binding || 'CACHE', id: cacheConfig.namespaceId })
  }

  const { namespaceId: _namespaceId, ...cacheStorageConfig } = cacheConfig
  nitro.options.storage ||= {}
  nitro.options.storage.cache = defu(nitro.options.storage.cache, cacheStorageConfig)

  if (nitro.options.dev) {
    nitro.options.devStorage ||= {}
    nitro.options.devStorage.cache = defu(nitro.options.devStorage.cache, cacheStorageConfig)
  }

  log.info(`\`hub:cache\` using \`${cacheConfig.driver.split('/').pop()}\` driver`)
}
