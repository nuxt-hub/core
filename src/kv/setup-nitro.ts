import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { join } from 'pathe'
import { defu } from 'defu'
import type { Nitro } from 'nitropack/types'
import type { HubConfig, ResolvedKVConfig } from '@nuxthub/core'
import { resolveKVConfig } from './resolve'
import { resolve, addWranglerBindingNitro } from '../utils-nitro'

export async function setupKVNitro(nitro: Nitro, hub: HubConfig, deps: Record<string, string>) {
  hub.kv = resolveKVConfig(hub)
  if (!hub.kv) return

  const kvConfig = hub.kv as ResolvedKVConfig
  const log = nitro.logger.withTag('nitro:hub')

  if (kvConfig.driver === 'cloudflare-kv-binding' && kvConfig.namespaceId) {
    addWranglerBindingNitro(nitro, 'kv_namespaces', { binding: kvConfig.binding || 'KV', id: kvConfig.namespaceId })
  }

  if (kvConfig.driver === 'upstash' && !deps['@upstash/redis']) {
    log.error('Please run `npx nypm i @upstash/redis` to use Upstash Redis KV storage')
  }
  if (kvConfig.driver === 'redis' && !deps['ioredis']) {
    log.error('Please run `npx nypm i ioredis` to use Redis KV storage')
  }
  if (hub.hosting.includes('vercel') && kvConfig.driver === 'fs-lite') {
    log.error('Vercel hosting requires a Redis connection. Please set the `REDIS_URL` environment variable. See https://vercel.com/marketplace/category/database')
  }

  const { namespaceId: _namespaceId, ...kvStorageConfig } = kvConfig
  nitro.options.storage ||= {}
  nitro.options.storage.kv = defu(nitro.options.storage.kv, kvStorageConfig)

  const { driver, ...driverOptions } = kvStorageConfig

  const kvContent = `import { createStorage } from "unstorage"
import driver from "unstorage/drivers/${driver}";

export const kv = createStorage({
  driver: driver(${JSON.stringify(driverOptions)}),
});
`

  const physicalKvDir = join(nitro.options.rootDir, 'node_modules', '@nuxthub', 'kv')
  await mkdir(physicalKvDir, { recursive: true })

  await writeFile(join(physicalKvDir, 'kv.mjs'), kvContent)
  await copyFile(resolve('kv/runtime/kv.d.ts'), join(physicalKvDir, 'kv.d.ts'))

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
  await writeFile(join(physicalKvDir, 'package.json'), JSON.stringify(packageJson, null, 2))

  nitro.options.alias ||= {}
  nitro.options.alias['hub:kv'] = '@nuxthub/kv'

  if (nitro.options.imports !== false) {
    nitro.options.imports = nitro.options.imports || {}
    nitro.options.imports.presets ??= []
    nitro.options.imports.presets.push({ from: '@nuxthub/kv', imports: ['kv'] })
  }

  nitro.hooks.hook('types:extend', async (types) => {
    const dtsContents = `declare module 'hub:kv' {\n  export * from '@nuxthub/kv'\n}\n`
    const dtsPath = join(nitro.options.buildDir, 'types/hub-kv.d.ts')
    await mkdir(join(nitro.options.buildDir, 'types'), { recursive: true })
    await writeFile(dtsPath, dtsContents)
    if (types.tsConfig) {
      types.tsConfig.include = types.tsConfig.include || []
      types.tsConfig.include.push(dtsPath)
    }
  })

  log.info(`\`hub:kv\` using \`${driver}\` driver`)
}
