import { join } from 'pathe'
import { defu } from 'defu'

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
