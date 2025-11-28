import { join } from 'pathe'
import { defu } from 'defu'
import { addServerScanDir, addServerImportsDir } from '@nuxt/kit'
import { logWhenReady } from '../features'
import { resolve } from '../module'

import type { Nuxt } from '@nuxt/schema'
import type { HubConfig } from '../types'

interface KVConfig {
  driver: string
  url?: string
  base?: string
  binding?: string
}

export function setupKV(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>) {
  const kvConfig = resolveKVConfig(hub)

  // Verify dependencies
  if (kvConfig.driver === 'redis' && !deps['ioredis']) {
    logWhenReady(nuxt, 'Please run `npx nypm i ioredis` to use Redis KV storage', 'error')
  }

  // // Configure dev storage (local development)
  // nuxt.options.nitro.devStorage ||= {}
  // nuxt.options.nitro.devStorage.kv = defu(nuxt.options.nitro.devStorage.kv, {
  //   driver: 'fs',
  //   base: join(hub.dir!, 'kv')
  // })

  // Configure production storage
  nuxt.options.nitro.storage ||= {}
  nuxt.options.nitro.storage.kv = defu(nuxt.options.nitro.storage.kv, kvConfig)

  // Add Server scanning
  addServerScanDir(resolve('runtime/kv/server'))
  addServerImportsDir(resolve('runtime/kv/server/utils'))

  logWhenReady(nuxt, `\`hubKV()\` configured with \`${kvConfig.driver}\` driver`)
}

function resolveKVConfig(hub: HubConfig): KVConfig {
  // Redis (Vercel, Upstash, etc.)
  if (process.env.REDIS_URL) {
    return {
      driver: 'redis',
      url: process.env.REDIS_URL
    }
  }

  // Cloudflare KV
  if (hub.hosting.includes('cloudflare')) {
    return {
      driver: 'cloudflare-kv-binding',
      binding: 'KV'
    }
  }

  // Deno KV
  if (hub.hosting.includes('deno')) {
    return {
      driver: 'deno-kv'
    }
  }

  // Default: local file storage
  return {
    driver: 'fs-lite',
    base: '.data/kv'
  }
}
