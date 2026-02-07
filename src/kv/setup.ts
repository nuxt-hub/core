import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { join } from 'pathe'
import { defu } from 'defu'
import { addTypeTemplate, addServerImports } from '@nuxt/kit'
import { resolve, logWhenReady, addWranglerBinding } from '../utils'
import { resolveKVConfig } from './resolve'

import type { Nuxt } from '@nuxt/schema'
import type { HubConfig, ResolvedKVConfig } from '@nuxthub/core'

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
