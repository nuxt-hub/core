import { writeFile, readFile, mkdir } from 'node:fs/promises'
import { defineNuxtModule, logger, addTemplate } from '@nuxt/kit'
import { join, relative, resolve as resolveFs } from 'pathe'
import { defu } from 'defu'
import { findWorkspaceDir, readPackageJSON } from 'pkg-types'
import { provider } from 'std-env'
import { version } from '../package.json'
import { setupCache } from './cache/setup'
import { setupDatabase } from './db/setup'
import { setupKV } from './kv/setup'
import { setupBlob } from './blob/setup'
import type { ModuleOptions, HubConfig, ResolvedHubConfig } from '@nuxthub/core'
import { addDevToolsCustomTabs } from './devtools'
import { setupCloudflare } from './hosting/cloudflare'
import type { NuxtModule } from '@nuxt/schema'

const log = logger.withTag('nuxt:hub')

export * from './types/index'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@nuxthub/core',
    configKey: 'hub',
    version,
    docs: 'https://hub.nuxt.com'
  },
  defaults: {},
  async setup(options, nuxt) {
    // Cannot be used with `nuxt generate`
    if (nuxt.options.nitro.static || (nuxt.options as any)._generate) {
      log.error('NuxtHub is not compatible with `nuxt generate` as it needs a server to run.')
      log.info('To pre-render all pages: `https://hub.nuxt.com/docs/recipes/pre-rendering#pre-render-all-pages`')
      return process.exit(1)
    }

    const rootDir = nuxt.options.rootDir
    const hosting = process.env.NITRO_PRESET || nuxt.options.nitro.preset || provider
    const hub = defu(options, {
      // Local storage
      dir: '.data',
      hosting,
      // NuxtHub features
      blob: false,
      cache: false,
      db: false,
      kv: false
    }) as HubConfig
    // resolve the hub directory
    hub.dir = await resolveFs(nuxt.options.rootDir, hub.dir)

    // Create the hub directory
    await mkdir(hub.dir, { recursive: true })
      .catch((e: any) => {
        if (e.errno !== -17) throw e
      })

    const packageJSON = await readPackageJSON(nuxt.options.rootDir)
    const deps = Object.assign({}, packageJSON.dependencies, packageJSON.devDependencies)
    await setupBlob(nuxt, hub as HubConfig, deps)
    await setupCache(nuxt, hub as HubConfig, deps)
    await setupDatabase(nuxt, hub as HubConfig, deps)
    await setupKV(nuxt, hub as HubConfig, deps)

    const runtimeConfig = nuxt.options.runtimeConfig
    runtimeConfig.hub = hub as ResolvedHubConfig
    runtimeConfig.public.hub ||= {}
    if (nuxt.options._prepare) {
      addTemplate({
        filename: 'hub/db/config.json',
        write: true,
        getContents: () => JSON.stringify(hub, null, 2)
      })
    }

    // nuxt prepare, stop here
    if (nuxt.options._prepare) {
      return
    }

    // Add custom tabs to Nuxt DevTools
    if (nuxt.options.dev) {
      addDevToolsCustomTabs(nuxt, hub)
    }

    // Enable Async Local Storage
    nuxt.options.nitro.experimental = nuxt.options.nitro.experimental || {}
    nuxt.options.nitro.experimental.asyncContext = true

    if (!nuxt.options.dev && hub.hosting.includes('cloudflare')) {
      setupCloudflare(nuxt, hub)
    }

    // Add .data to .gitignore
    if (nuxt.options.dev) {
      const workspaceDir = await findWorkspaceDir(rootDir)
      // Add it to .gitignore
      const gitignorePath = join(workspaceDir, '.gitignore')
      const gitignore = await readFile(gitignorePath, 'utf-8').catch(() => '')
      const relativeDir = relative(workspaceDir, hub.dir)
      if (!gitignore.includes(relativeDir)) {
        await writeFile(gitignorePath, `${gitignore ? gitignore + '\n' : gitignore}${relativeDir}`, 'utf-8')
      }
    }
  }
}) as NuxtModule<ModuleOptions>
