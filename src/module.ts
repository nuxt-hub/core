import { writeFile, readFile, mkdir } from 'node:fs/promises'
import { defineNuxtModule, createResolver, logger, addTemplate } from '@nuxt/kit'
import { join } from 'pathe'
import { defu } from 'defu'
import { findWorkspaceDir, readPackageJSON } from 'pkg-types'
import { provider } from 'std-env'
import { version } from '../package.json'
import { setupCache } from './features/cache'
import { setupDatabase } from './db/setup'
import { setupKV } from './features/kv'
import { setupBlob } from './features/blob'
import type { BlobConfig, CacheConfig, HubConfig, KVConfig, ResolvedHubConfig } from './types/module'
import { addDevToolsCustomTabs } from './devtools'
import type { DatabaseConfig } from './db/types'
import type { NuxtModule} from '@nuxt/schema'

const log = logger.withTag('nuxt:hub')

export * from './types/hooks'
// export * from './types/blob'

export interface ModuleOptions {
  /**
   * Set `true` to enable blob storage with auto-configuration.
   * Or provide a BlobConfig object with driver and connection details.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/features/blob
   */
  blob?: boolean | BlobConfig
  /**
   * Set `true` to enable caching for the project with auto-configuration.
   * Or provide a CacheConfig object with driver and connection details.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/features/cache
   */
  cache?: boolean | CacheConfig
  /**
   * Set to `'postgresql'`, `'sqlite'`, or `'mysql'` to use a specific database dialect with a zero-config development database.
   * Or provide a DatabaseConfig object with dialect and connection details.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/features/database
   */
  db?: 'postgresql' | 'sqlite' | 'mysql' | DatabaseConfig | false
  /**
   * Set `true` to enable the key-value storage with auto-configuration.
   * Or provide a KVConfig object with driver and connection details.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/features/kv
   */
  kv?: boolean | KVConfig
  /**
   * The directory used for storage (database, kv, etc.) during local development.
   * @default '.data'
   */
  dir?: string
  /**
   * The hosting provider that the project is hosted on.
   * This is automatically determined using the NITRO_PRESET or the detected provider during the CI/CD.
   */
  hosting?: string
}

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
    const { resolve } = createResolver(import.meta.url)

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

    // Create the hub directory
    await mkdir(join(nuxt.options.rootDir, hub.dir), { recursive: true })
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

    if (nuxt.options.nitro.preset?.includes('cloudflare') && hub.hosting.includes('cloudflare')) {
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

      // Enable Cloudflare Node.js compatibility
      nuxt.options.nitro.cloudflare ||= {}
      nuxt.options.nitro.cloudflare.nodeCompat = true
      // Remove trailing slash for prerender routes
      nuxt.options.nitro.prerender ||= {}
      nuxt.options.nitro.prerender.autoSubfolderIndex ||= false

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
}) as NuxtModule<ModuleOptions, ModuleOptions, false>
