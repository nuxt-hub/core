import { defu } from 'defu'
import { addTypeTemplate, addServerImports, addTemplate } from '@nuxt/kit'
import { logWhenReady } from '../features'
import { resolve } from '../module'

import type { Nuxt } from '@nuxt/schema'
import type { HubConfig, KVConfig, ResolvedKVConfig } from '../types'

/**
 * Resolve KV configuration from boolean or object format
 */
export function resolveKVConfig(hub: HubConfig): ResolvedKVConfig | false {
  if (!hub.kv) return false

  // Start with user-provided config if it's an object
  const userConfig = typeof hub.kv === 'object' ? hub.kv : {} as KVConfig

  // If driver is already specified by user, use it with their options
  if (userConfig.driver) {
    return userConfig as ResolvedKVConfig
  }

  // Redis (Vercel, Upstash, etc.)
  if (process.env.REDIS_URL) {
    return defu(userConfig, {
      driver: 'redis',
      url: process.env.REDIS_URL
    }) as ResolvedKVConfig
  }

  // Cloudflare KV
  if (hub.hosting.includes('cloudflare')) {
    return defu(userConfig, {
      driver: 'cloudflare-kv-binding',
      binding: 'KV'
    }) as ResolvedKVConfig
  }

  // Deno KV
  if (hub.hosting.includes('deno')) {
    return defu(userConfig, {
      driver: 'deno-kv'
    }) as ResolvedKVConfig
  }

  // Default: local file storage
  return defu(userConfig, {
    driver: 'fs-lite',
    base: '.data/kv'
  }) as ResolvedKVConfig
}

export function setupKV(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>) {
  hub.kv = resolveKVConfig(hub)
  if (!hub.kv) return

  const kvConfig = hub.kv as KVConfig

  // Verify dependencies
  if (kvConfig.driver === 'redis' && !deps['ioredis']) {
    logWhenReady(nuxt, 'Please run `npx nypm i ioredis` to use Redis KV storage', 'error')
  }
  if (hub.hosting.includes('vercel') && kvConfig.driver === 'fs-lite') {
    logWhenReady(nuxt, 'Vercel hosting requires a Redis connection. Please set the `REDIS_URL` environment variable. See https://vercel.com/marketplace/category/database', 'error')
  }

  // Configure production storage
  nuxt.options.nitro.storage ||= {}
  nuxt.options.nitro.storage.kv = defu(nuxt.options.nitro.storage.kv, kvConfig)

  const { driver, ...driverOptions } = kvConfig
  const template = addTemplate({
    filename: 'hub/kv.mjs',
    getContents: () => `import { createStorage } from "unstorage"
import driver from "unstorage/drivers/${driver}";

export const kv = createStorage({
  driver: driver(${JSON.stringify(driverOptions)}),
});
`,
    write: true
  })
  addServerImports({ name: 'kv', from: 'hub:kv', meta: { description: `The Key-Value storage instance.` } })
  addTypeTemplate({
    src: resolve('types/kv.d.ts'),
    filename: 'hub/kv.d.ts'
  }, { nitro: true })
  nuxt.options.nitro.alias ||= {}
  nuxt.options.nitro.alias['hub:kv'] = template.dst

  logWhenReady(nuxt, `\`hub:kv\` using \`${driver}\` driver`)
}
