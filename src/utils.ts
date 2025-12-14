import type { Nuxt } from '@nuxt/schema'
import { logger, createResolver } from '@nuxt/kit'

const log = logger.withTag('nuxt:hub')

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
