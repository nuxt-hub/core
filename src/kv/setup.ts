import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'pathe'
import { defu } from 'defu'
import { addTemplate, addTypeTemplate, addServerImports } from '@nuxt/kit'
import { resolve, logWhenReady, addWranglerBinding } from '../utils'

import type { Nuxt } from '@nuxt/schema'
import type { HubConfig, ResolvedKVConfig } from '@nuxthub/core'

/**
 * Resolve KV configuration from boolean or object format
 */
export function resolveKVConfig(hub: HubConfig): ResolvedKVConfig | false {
  if (!hub.kv) return false

  // If driver is already specified by user, use it with their options
  if (typeof hub.kv === 'object' && 'driver' in hub.kv) {
    if (hub.kv.driver === 'cloudflare-kv-binding') {
      return defu(hub.kv, { binding: 'KV' }) as ResolvedKVConfig
    }
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

export async function setupKV(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>) {
  hub.kv = resolveKVConfig(hub)
  if (!hub.kv) return

  const kvConfig = hub.kv as ResolvedKVConfig

  if (kvConfig.driver === 'cloudflare-kv-binding' && kvConfig.namespaceId) {
    addWranglerBinding(nuxt, 'kv_namespaces', { binding: kvConfig.binding || 'KV', id: kvConfig.namespaceId })
  }

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
  const { namespaceId: _namespaceId, ...kvStorageConfig } = kvConfig
  nuxt.options.nitro.storage ||= {}
  nuxt.options.nitro.storage.kv = defu(nuxt.options.nitro.storage.kv, kvStorageConfig)

  const { driver, ...driverOptions } = kvStorageConfig

  // Generate KV content
  const kvContent = `import { createStorage } from "unstorage"
import driver from "unstorage/drivers/${driver}";

export const kv = createStorage({
  driver: driver(${JSON.stringify(driverOptions)}),
});
`

  const kvHash = createHash('sha256').update(kvContent).digest('hex').slice(0, 12)
  const kvShimTemplate = addTemplate({
    filename: `hub/kv.${kvHash}.mjs`,
    write: true,
    getContents: () => kvContent
  })

  nuxt.options.alias ||= {}
  nuxt.options.alias['@nuxthub/kv'] = kvShimTemplate.dst
  nuxt.options.alias['hub:kv'] = kvShimTemplate.dst

  // Create package.json for Node.js module resolution
  const packageJson = {
    name: '@nuxthub/kv',
    version: '0.0.0',
    type: 'module',
    exports: {
      '.': {
        types: './kv.d.ts',
        default: './kv.mjs'
      }
    }
  }

  // Add auto-imports for both @nuxthub/kv and hub:kv
  addServerImports({ name: 'kv', from: '@nuxthub/kv', meta: { description: `The Key-Value storage instance.` } })

  // Setup KV Types for @nuxthub/kv and hub:kv.
  addTypeTemplate({
    filename: 'hub/kv.d.ts',
    getContents: () => `import type { KVStorage } from '@nuxthub/core/kv'

declare module '@nuxthub/kv' {
  export const kv: KVStorage
}

declare module 'hub:kv' {
  export * from '@nuxthub/kv'
}`
  }, { nitro: true, nuxt: true })

  // Only materialize a physical package during build.
  nuxt.hook('nitro:build:before', async () => {
    const physicalKvDir = join(nuxt.options.rootDir, 'node_modules', '@nuxthub', 'kv')
    await mkdir(physicalKvDir, { recursive: true })
    await writeFile(join(physicalKvDir, 'kv.mjs'), kvContent)
    await copyFile(resolve('kv/runtime/kv.d.ts'), join(physicalKvDir, 'kv.d.ts'))
    await writeFile(join(physicalKvDir, 'package.json'), JSON.stringify(packageJson, null, 2))
  })

  logWhenReady(nuxt, `\`hub:kv\` using \`${driver}\` driver`)
}
