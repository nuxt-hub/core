import { defu } from 'defu'
import { addServerScanDir, addServerImportsDir } from '@nuxt/kit'
import { logWhenReady } from '../features'
import { resolve } from '../module'

import type { Nuxt } from '@nuxt/schema'
import type { HubConfig, KVConfig } from '../types'

/**
 * Resolve KV configuration from boolean or object format
 */
export function resolveKVConfig(hub: HubConfig): KVConfig | false {
  if (!hub.kv) return false

  // Start with user-provided config if it's an object
  const userConfig = typeof hub.kv === 'object' ? hub.kv : {}

  // If driver is already specified by user, use it with their options
  if (userConfig.driver) {
    return userConfig as KVConfig
  }

  // Redis (Vercel, Upstash, etc.)
  if (process.env.REDIS_URL) {
    return defu(userConfig, {
      driver: 'redis',
      url: process.env.REDIS_URL
    }) as KVConfig
  }

  if (hub.hosting.includes('vercel') && !userConfig.driver) {
    throw new Error('Vercel hosting requires a Redis connection. Please set the `REDIS_URL` environment variable. See https://vercel.com/marketplace/category/database')
  }

  // Cloudflare KV
  if (hub.hosting.includes('cloudflare')) {
    return defu(userConfig, {
      driver: 'cloudflare-kv-binding',
      binding: 'KV'
    }) as KVConfig
  }

  // Deno KV
  if (hub.hosting.includes('deno')) {
    return defu(userConfig, {
      driver: 'deno-kv'
    }) as KVConfig
  }

  // Default: local file storage
  return defu(userConfig, {
    driver: 'fs-lite',
    base: '.data/kv'
  }) as KVConfig
}

export function setupKV(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>) {
  hub.kv = resolveKVConfig(hub)
  if (!hub.kv) return

  const kvConfig = hub.kv as KVConfig

  // Verify dependencies
  if (kvConfig.driver === 'redis' && !deps['ioredis']) {
    logWhenReady(nuxt, 'Please run `npx nypm i ioredis` to use Redis KV storage', 'error')
  }

  // Configure production storage
  nuxt.options.nitro.storage ||= {}
  nuxt.options.nitro.storage.kv = defu(nuxt.options.nitro.storage.kv, kvConfig)

  // Add Server scanning
  addServerScanDir(resolve('runtime/kv/server'))
  addServerImportsDir(resolve('runtime/kv/server/utils'))

  nuxt.options.nitro.alias ||= {}
  nuxt.options.nitro.alias['hub:kv'] = resolve('runtime/kv/server/utils/kv.ts')

  logWhenReady(nuxt, `\`hub:kv\` configured with \`${kvConfig.driver}\` driver`)
}
