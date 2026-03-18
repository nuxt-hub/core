import type { Nuxt } from '@nuxt/schema'
import { logger, createResolver } from '@nuxt/kit'
import type { HubConfig, ResolvedHubConfig } from '@nuxthub/core'

const log = logger.withTag('nuxt:hub')

/**
 * Check if any Cloudflare binding ID is configured (databaseId, namespaceId, bucketName, hyperdriveId)
 * When a binding ID is present, we use remote Cloudflare bindings via getPlatformProxy in dev
 */
export function hasRemoteBindingId(hub: HubConfig | ResolvedHubConfig): boolean {
  const dbConfig = typeof hub.db === 'object' && hub.db ? hub.db : null
  const kvConfig = typeof hub.kv === 'object' && hub.kv ? hub.kv : null
  const cacheConfig = typeof hub.cache === 'object' && hub.cache ? hub.cache : null
  const blobConfig = typeof hub.blob === 'object' && hub.blob ? hub.blob : null

  return !!(
    dbConfig?.connection?.databaseId
    || dbConfig?.connection?.hyperdriveId
    || kvConfig?.namespaceId
    || cacheConfig?.namespaceId
    || (blobConfig?.driver === 'cloudflare-r2' && blobConfig.bucketName)
  )
}

export function logWhenReady(nuxt: Nuxt, message: string, type: 'info' | 'warn' | 'error' = 'info') {
  if (nuxt.options._prepare) {
    return
  }
  if (nuxt.options.dev) {
    nuxt.hooks.hookOnce('modules:done', () => {
      log[type](message)
    })
  } else {
    log[type](message)
  }
}

export const { resolve, resolvePath } = createResolver(import.meta.url)

type WranglerBindingType = 'd1_databases' | 'r2_buckets' | 'kv_namespaces' | 'hyperdrive'

export function addWranglerBinding(nuxt: Nuxt, type: WranglerBindingType, binding: { binding: string, [key: string]: any }) {
  nuxt.options.nitro.cloudflare ||= {}
  nuxt.options.nitro.cloudflare.wrangler ||= {}
  nuxt.options.nitro.cloudflare.wrangler[type] ||= []
  const existing = nuxt.options.nitro.cloudflare.wrangler[type] as Array<{ binding: string }>
  if (!existing.some(b => b.binding === binding.binding)) {
    (existing as any[]).push(binding)
  }
}
