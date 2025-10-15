import { writeFile } from 'node:fs/promises'
import { join } from 'pathe'
import type { Nuxt } from '@nuxt/schema'
import type { HubConfig } from '../features'

import { setupProductionAI } from '../features/ai'
import { setupProductionBlob } from '../features/blob'
import { setupProductionCache } from '../features/cache'
import { setupProductionDatabase } from '../features/database'
import { setupProductionKV } from '../features/kv'

import { copyDatabaseAssets, applyBuildTimeMigrations } from './database'

export function addBuildHooks(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>) {
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
  if (nuxt.options.dev) return

  nuxt.hook('nitro:init', async (nitro) => {
    if (nuxt.options.nitro.preset?.includes('cloudflare')) {
      nitro.options.cloudflare ||= {}
      nitro.options.cloudflare.nodeCompat = true
    }

    await Promise.all([
      hub.ai && await setupProductionAI(nitro, hub, deps),
      hub.blob && await setupProductionBlob(nitro, hub, deps),
      hub.cache && await setupProductionCache(nitro, hub, deps),
      hub.database && await setupProductionDatabase(nitro, hub, deps),
      hub.kv && await setupProductionKV(nitro, hub, deps)
    ])
  })
}
