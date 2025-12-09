import { defu } from 'defu'
import { addTypeTemplate, addServerImports, addTemplate } from '@nuxt/kit'
import { resolve, logWhenReady } from '../utils'

import type { Nuxt } from '@nuxt/schema'
import type { HubConfig, ResolvedKVConfig } from '@nuxthub/core'

/**
 * Resolve KV configuration from boolean or object format
 */
export function resolveKVConfig(hub: HubConfig): ResolvedKVConfig | false {
  if (!hub.kv) return false

  // If driver is already specified by user, use it with their options
  if (typeof hub.kv === 'object' && 'driver' in hub.kv) {
    return hub.kv as ResolvedKVConfig
  }

  // Upstash Redis
  if ((process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) || (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)) {
    return defu(hub.kv, {
      driver: 'upstash',
      url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
    }) as ResolvedKVConfig
  }
  // Redis
  if (process.env.REDIS_URL || process.env.KV_URL?.startsWith('rediss://')) {
    return defu(hub.kv, {
      driver: 'redis',
      url: process.env.REDIS_URL || process.env.KV_URL
    }) as ResolvedKVConfig
  }
  // S3
  if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && process.env.S3_BUCKET && process.env.S3_REGION) {
    return defu(hub.kv, {
      driver: 's3',
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT || undefined
    }) as ResolvedKVConfig
  }

  // Cloudflare KV
  if (hub.hosting.includes('cloudflare')) {
    return defu(hub.kv, {
      driver: 'cloudflare-kv-binding',
      binding: 'KV'
    }) as ResolvedKVConfig
  }

  // Deno KV
  if (hub.hosting.includes('deno')) {
    return defu(hub.kv, {
      driver: 'deno-kv'
    }) as ResolvedKVConfig
  }

  // Default: local file storage
  return defu(hub.kv, {
    driver: 'fs-lite',
    base: '.data/kv'
  }) as ResolvedKVConfig
}

export function setupKV(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>) {
  hub.kv = resolveKVConfig(hub)
  if (!hub.kv) return

  const kvConfig = hub.kv as ResolvedKVConfig

  // Verify dependencies
  if (kvConfig.driver === 'upstash' && !deps['@upstash/redis']) {
    logWhenReady(nuxt, 'Please run `npx nypm i @upstash/redis` to use Upstash Redis KV storage', 'error')
  }
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
    src: resolve('kv/runtime/kv.d.ts'),
    filename: 'hub/kv.d.ts'
  }, { nitro: true, nuxt: true })
  nuxt.options.alias['hub:kv'] = template.dst

  logWhenReady(nuxt, `\`hub:kv\` using \`${driver}\` driver`)
}
