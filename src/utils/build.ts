import { writeFile, cp } from 'node:fs/promises'
import { logger } from '@nuxt/kit'
import { join, resolve } from 'pathe'
import { defu } from 'defu'
import type { Nuxt } from '@nuxt/schema'
import type { HubConfig } from '../features'

import { configureProductionBlobDriver } from '../zero-config/blob'
import { configureProductionCacheDriver } from '../zero-config/cache'
import { configureProductionDatabaseConnector } from '../zero-config/database'
import { configureProductionKVDriver } from '../zero-config/kv'


const log = logger.withTag('nuxt:hub')

export function addBuildHooks(nuxt: Nuxt, hub: HubConfig) {
  // Write `dist/hub.config.json` after public assets are built
  nuxt.hook('nitro:build:public-assets', async (nitro) => {
    const hubConfig = {
      // ai: hub.ai,
      blob: hub.blob,
      cache: hub.cache,
      database: hub.database,
      kv: hub.kv
    }
    const distDir = nitro.options.output.dir || nitro.options.output.publicDir
    await writeFile(join(distDir, 'hub.config.json'), JSON.stringify(hubConfig, null, 2), 'utf-8')

    if (hub.database) {
      try {
        await cp(resolve(nitro.options.rootDir, hub.dir!, 'database/migrations'), resolve(nitro.options.output.dir, 'database/migrations'), { recursive: true })
        await cp(resolve(nitro.options.rootDir, hub.dir!, 'database/queries'), resolve(nitro.options.output.dir, 'database/queries'), { recursive: true })
        log.info('Database migrations and queries included in build')
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          log.info('Skipping bundling database migrations - no migrations found')
        }
      }
    }
  })

  // Zero-config resources setup
  nuxt.hook('nitro:init', async (nitro) => {
    if (!nuxt.options.dev) {
      await Promise.all([
        hub.blob && await configureProductionBlobDriver(nitro, hub),
        hub.cache && await configureProductionCacheDriver(nitro, hub),
        hub.database && await configureProductionDatabaseConnector(nitro, hub),
        hub.kv && await configureProductionKVDriver(nitro, hub)
      ])
    }
  })
}
