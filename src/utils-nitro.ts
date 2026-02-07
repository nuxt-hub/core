import { fileURLToPath } from 'node:url'
import { dirname, resolve as resolveFs } from 'pathe'
import type { Nitro } from 'nitropack/types'

const baseDir = dirname(fileURLToPath(import.meta.url))

export function resolve(...paths: string[]) {
  return resolveFs(baseDir, ...paths)
}

type WranglerBindingType = 'd1_databases' | 'r2_buckets' | 'kv_namespaces' | 'hyperdrive'

export function addWranglerBindingNitro(nitro: Nitro, type: WranglerBindingType, binding: { binding: string, [key: string]: any }) {
  nitro.options.cloudflare ||= {}
  nitro.options.cloudflare.wrangler ||= {}
  nitro.options.cloudflare.wrangler[type] ||= []
  const existing = nitro.options.cloudflare.wrangler[type] as Array<{ binding: string }>
  if (!existing.some(b => b.binding === binding.binding)) {
    (existing as any[]).push(binding)
  }
}
