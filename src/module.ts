import { mkdir } from 'node:fs/promises'
import { defineNitroModule } from 'nitropack/kit'
import { defu } from 'defu'
import { resolve as resolveFs } from 'pathe'
import { readPackageJSON } from 'pkg-types'
import { provider } from 'std-env'
import { setupCacheNitro } from './cache/setup-nitro'
import { setupDatabaseNitro } from './db/setup-nitro'
import { setupKVNitro } from './kv/setup-nitro'
import { setupBlobNitro } from './blob/setup-nitro'
import { setupCloudflareNitro } from './hosting/cloudflare'
import type { HubConfig, ResolvedHubConfig } from './types'

export type { ModuleOptions } from './types'
export * from './types/index'

export default defineNitroModule({
  name: '@nuxthub/core',
  async setup(nitro) {
    const hosting = process.env.NITRO_PRESET || nitro.options.preset || provider
    const hub = defu(nitro.options.hub, {
      dir: '.data',
      hosting,
      blob: false,
      cache: false,
      db: false,
      kv: false
    }) as HubConfig

    hub.dir = await resolveFs(nitro.options.rootDir, hub.dir)

    await mkdir(hub.dir, { recursive: true })
      .catch((e: any) => {
        if (e.errno !== -17) throw e
      })

    const packageJSON = await readPackageJSON(nitro.options.rootDir)
    const deps = Object.assign({}, packageJSON.dependencies, packageJSON.devDependencies)
    await setupBlobNitro(nitro, hub, deps)
    await setupCacheNitro(nitro, hub, deps)
    await setupDatabaseNitro(nitro, hub, deps)
    await setupKVNitro(nitro, hub, deps)

    nitro.options.runtimeConfig ||= {}
    nitro.options.runtimeConfig.hub = hub as ResolvedHubConfig

    nitro.options.experimental ||= {}
    nitro.options.experimental.asyncContext = true

    if (!nitro.options.dev && hub.hosting.includes('cloudflare')) {
      setupCloudflareNitro(nitro, hub)
    }
  }
})
