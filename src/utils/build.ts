import { writeFile } from 'node:fs/promises'
import { join } from 'pathe'
import type { Nuxt } from '@nuxt/schema'
import type { HubConfig } from '../features'

import { configureProductionBlobDriver } from '../zero-config/blob'
import { configureProductionCacheDriver } from '../zero-config/cache'
import { configureProductionDatabaseConnector } from '../zero-config/database'
import { configureProductionKVDriver } from '../zero-config/kv'

import { copyDatabaseAssets, applyBuildTimeMigrations } from './database'

export function addBuildHooks(nuxt: Nuxt, hub: HubConfig) {
  nuxt.hook('nitro:build:public-assets', async (nitro) => {
    // Write `dist/hub.config.json` after public assets are built
    const hubConfig = {
      // ai: hub.ai,
      blob: hub.blob,
      cache: hub.cache,
      database: hub.database,
      kv: hub.kv
    }
    const distDir = nitro.options.output.dir || nitro.options.output.publicDir
    await writeFile(join(distDir, 'hub.config.json'), JSON.stringify(hubConfig, null, 2), 'utf-8')

    // Database migrations
    await copyDatabaseAssets(nitro, hub)
    await applyBuildTimeMigrations(nitro, hub)
  })

  // Zero-config resources setup
  nuxt.hook('nitro:init', async (nitro) => {
    if (nuxt.options.dev) return
    if (nuxt.options.nitro.preset?.includes('cloudflare')) {
      nitro.options.cloudflare ||= {}
      nitro.options.cloudflare.nodeCompat = true
    }

    await Promise.all([
      hub.blob && await configureProductionBlobDriver(nitro, hub),
      hub.cache && await configureProductionCacheDriver(nitro, hub),
      hub.database && await configureProductionDatabaseConnector(nitro, hub),
      hub.kv && await configureProductionKVDriver(nitro, hub)
    ])
  })
}
