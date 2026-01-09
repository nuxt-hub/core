import type { Nuxt } from '@nuxt/schema'
import { logger, createResolver } from '@nuxt/kit'
import type { HubConfig } from '@nuxthub/core'

const log = logger.withTag('nuxt:hub')

/** Check if running in dev mode with remote Cloudflare bindings enabled */
export function isRemoteDev(nuxt: Nuxt, hub: HubConfig): boolean {
  return nuxt.options.dev && hub.remote
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
