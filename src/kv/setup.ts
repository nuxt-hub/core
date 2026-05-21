import { mkdir, writeFile, copyFile, symlink } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, dirname } from 'pathe'
import { sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defu } from 'defu'
import { addTypeTemplate, addServerImports } from '@nuxt/kit'
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

  // Write to node_modules/@nuxthub/kv/ for direct imports (workflow compatibility)
  const physicalKvDir = join(nuxt.options.rootDir, 'node_modules', '@nuxthub', 'kv')
  await mkdir(physicalKvDir, { recursive: true })

  // Write kv.mjs to node_modules/@nuxthub/kv/
  await writeFile(
    join(physicalKvDir, 'kv.mjs'),
    kvContent
  )

  // Copy kv.d.ts for TypeScript support
  await copyFile(
    resolve('kv/runtime/kv.d.ts'),
    join(physicalKvDir, 'kv.d.ts')
  )

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
  await writeFile(
    join(physicalKvDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )

  const getPackageDirFromResolved = (resolved: string, pkgName: string) => {
    const marker = `${sep}node_modules${sep}${pkgName}${sep}`
    const idx = resolved.lastIndexOf(marker)
    if (idx === -1) return
    return resolved.slice(0, idx + marker.length - 1)
  }

  // pnpm uses isolated dependency graphs. The generated physical package lives in the project
  // root and won't see @nuxthub/core's dependencies unless we link them explicitly.
  // Best-effort: do not fail user dev servers if symlinks aren't supported.
  try {
    const selfPath = fileURLToPath(import.meta.url)
    const selfMarker = `${sep}node_modules${sep}@nuxthub${sep}core${sep}`
    const selfIdx = selfPath.lastIndexOf(selfMarker)
    const pnpmDepsDir = selfIdx === -1 ? undefined : `${selfPath.slice(0, selfIdx)}${sep}node_modules`

    const resolveFromEsm = (specifier: string) => {
      const r = (import.meta as any).resolve?.(specifier)
      if (!r) return
      try {
        return fileURLToPath(r)
      } catch {
        try {
          return fileURLToPath(new URL(r))
        } catch {
          return
        }
      }
    }

    const req = createRequire(import.meta.url)
    const unstorageDir = pnpmDepsDir
      ? join(pnpmDepsDir, 'unstorage')
      : (
          (() => {
            const unstorageResolved = resolveFromEsm('unstorage') || req.resolve('unstorage')
            return getPackageDirFromResolved(unstorageResolved, 'unstorage') || dirname(unstorageResolved)
          })()
        )

    const physicalKvNodeModules = join(physicalKvDir, 'node_modules')
    await mkdir(physicalKvNodeModules, { recursive: true })
    await symlink(unstorageDir, join(physicalKvNodeModules, 'unstorage'), 'dir').catch((e: any) => {
      if (e?.code !== 'EEXIST') throw e
    })
  } catch (e) {
    // debug-only: this is a compatibility helper
    logWhenReady(nuxt, `Failed to symlink unstorage for @nuxthub/kv: ${String((e as any)?.message || e)}`, 'debug')
  }

  // Create hub:kv alias to @nuxthub/kv for backwards compatibility
  nuxt.options.alias!['hub:kv'] = '@nuxthub/kv'

  // Add auto-imports for both @nuxthub/kv and hub:kv
  addServerImports({ name: 'kv', from: '@nuxthub/kv', meta: { description: `The Key-Value storage instance.` } })

  // Setup KV Types for hub:kv - point to @nuxthub/kv for type definitions
  addTypeTemplate({
    filename: 'hub/kv.d.ts',
    getContents: () => `declare module 'hub:kv' {
  export * from '@nuxthub/kv'
}`
  }, { nitro: true, nuxt: true })

  logWhenReady(nuxt, `\`hub:kv\` using \`${driver}\` driver`)
}
