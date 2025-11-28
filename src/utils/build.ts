import type { Nuxt } from '@nuxt/schema'
import type { ResolvedHubConfig } from '../types'

import { setupProductionBlob } from '../features/blob'
import { setupProductionCache } from '../features/cache'

import { copyDatabaseAssets, applyBuildTimeMigrations } from './db'

export function addBuildHooks(nuxt: Nuxt, hub: ResolvedHubConfig, deps: Record<string, string>) {
  nuxt.hook('nitro:build:public-assets', async (nitro) => {
    // Database migrations & queries
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
      hub.blob && await setupProductionBlob(nitro, hub, deps),
      hub.cache && await setupProductionCache(nitro, hub, deps)
    ])
  })
}
