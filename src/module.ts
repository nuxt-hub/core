import { writeFile, readFile } from 'node:fs/promises'
import { defineNuxtModule, createResolver, logger } from '@nuxt/kit'
import { join } from 'pathe'
import { defu } from 'defu'
import { findWorkspaceDir } from 'pkg-types'
import type { Nuxt } from '@nuxt/schema'
import { version } from '../package.json'
import { setupCache, setupOpenAPI, setupDatabase, setupKV, setupBase, setupBlob, type HubConfig } from './features'
import type { ModuleOptions } from './types/module'
import { addBuildHooks } from './utils/build'

export * from './types'

const log = logger.withTag('nuxt:hub')

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@nuxthub/core',
    configKey: 'hub',
    version,
    docs: 'https://hub.nuxt.com'
  },
  defaults: {},
  async setup(options: ModuleOptions, nuxt: Nuxt) {
    // Cannot be used with `nuxt generate`
    if (nuxt.options.nitro.static || (nuxt.options as any)._generate /* TODO: remove in future */) {
      log.error('NuxtHub is not compatible with `nuxt generate` as it needs a server to run.')
      log.info('To pre-render all pages: `https://hub.nuxt.com/docs/recipes/pre-rendering#pre-render-all-pages`')
      return process.exit(1)
    }

    const rootDir = nuxt.options.rootDir
    const { resolve } = createResolver(import.meta.url)

    const runtimeConfig = nuxt.options.runtimeConfig
    const databaseMigrationsDirs = nuxt.options._layers?.map(layer => join(layer.config.serverDir!, 'database/migrations')).filter(Boolean)
    const hub = defu({
      url: process.env.NUXT_HUB_URL,
      userToken: process.env.NUXT_HUB_USER_TOKEN
    }, runtimeConfig.hub || {}, options, {
      // Local storage
      dir: '.data',
      // NuxtHub features
      blob: false,
      cache: false,
      database: false,
      kv: false,
      // Database Migrations
      databaseMigrationsDirs,
      databaseQueriesPaths: [],
      // Other options
      version
    })

    runtimeConfig.hub = hub
    runtimeConfig.public.hub = {}

    if (nuxt.options.nitro.preset?.includes('cloudflare')) {
      nuxt.options.nitro.cloudflare ||= {}
      nuxt.options.nitro.cloudflare.nodeCompat = true
    }

    await setupBase(nuxt, hub as HubConfig)
    setupOpenAPI(nuxt, hub as HubConfig)
    hub.blob && setupBlob(nuxt, hub as HubConfig)
    hub.cache && await setupCache(nuxt, hub as HubConfig)
    hub.database && await setupDatabase(nuxt, hub as HubConfig)
    hub.kv && setupKV(nuxt, hub as HubConfig)

    // nuxt prepare, stop here
    if (nuxt.options._prepare) {
      return
    }

    addBuildHooks(nuxt, hub as HubConfig)

    // Enable Async Local Storage
    nuxt.options.nitro.experimental = nuxt.options.nitro.experimental || {}
    nuxt.options.nitro.experimental.asyncContext = true

    if (nuxt.options.nitro.preset?.includes('cloudflare')) {
      // Fix cloudflare:* externals in rollup
      nuxt.options.nitro.rollupConfig = nuxt.options.nitro.rollupConfig || {}
      nuxt.options.nitro.rollupConfig.plugins = ([] as any[]).concat(nuxt.options.nitro.rollupConfig.plugins || [])
      nuxt.options.nitro.rollupConfig.plugins.push({
        name: 'nuxthub-rollup-plugin',
        resolveId(id: string) {
          if (id.startsWith('cloudflare:')) {
            return { id, external: true }
          }
          return null
        }
      })

      // Enable Async Local Storage
      nuxt.options.nitro.unenv = nuxt.options.nitro.unenv || {}

      // @ts-expect-error unenv is not typed here
      nuxt.options.nitro.unenv.external = nuxt.options.nitro.unenv.external || []
      // @ts-expect-error unenv is not typed here
      if (!nuxt.options.nitro.unenv.external.includes('node:async_hooks')) {
      // @ts-expect-error unenv is not typed here
        nuxt.options.nitro.unenv.external.push('node:async_hooks')
      }

      // Production mode
      if (!nuxt.options.dev) {
        // Add node:stream to unenv external (only for Cloudflare Pages/Workers)
        // @ts-expect-error unenv is not typed here
        if (!nuxt.options.nitro.unenv.external.includes('node:stream')) {
          // @ts-expect-error unenv is not typed here
          nuxt.options.nitro.unenv.external.push('node:stream')
        }
        // @ts-expect-error unenv is not typed here
        if (!nuxt.options.nitro.unenv.external.includes('node:process')) {
          // @ts-expect-error unenv is not typed here
          nuxt.options.nitro.unenv.external.push('node:process')
        }
        // Add safer-buffer as alias to node:buffer
        // @ts-expect-error unenv is not typed here
        nuxt.options.nitro.unenv.alias ||= {}
        // @ts-expect-error unenv is not typed here
        if (!nuxt.options.nitro.unenv.alias['safer-buffer']) {
          // @ts-expect-error unenv is not typed here
          nuxt.options.nitro.unenv.alias['safer-buffer'] = 'node:buffer'
        }
      }

      // Add the env middleware
      nuxt.options.nitro.handlers ||= []
      nuxt.options.nitro.handlers.unshift({
        middleware: true,
        handler: resolve('./runtime/env')
      })
    }

    // Add .data to .gitignore
    if (nuxt.options.dev) {
      const workspaceDir = await findWorkspaceDir(rootDir)
      // Add it to .gitignore
      const gitignorePath = join(workspaceDir, '.gitignore')
      const gitignore = await readFile(gitignorePath, 'utf-8').catch(() => '')
      if (!gitignore.includes('.data')) {
        await writeFile(gitignorePath, `${gitignore ? gitignore + '\n' : gitignore}.data`, 'utf-8')
      }
    }
  }
})
