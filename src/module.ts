import { writeFile, readFile, mkdir } from 'node:fs/promises'
import { defineNuxtModule, logger, addTemplate, addServerPlugin } from '@nuxt/kit'
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
import { resolve, isRemoteDev } from './utils'
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
      // Remote Cloudflare bindings (connects to production during dev)
      remote: false,
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

    // Setup remote Cloudflare bindings for dev mode
    if (isRemoteDev(nuxt, hub as HubConfig)) {
      const wranglerPath = join(hub.dir, 'wrangler.toml')
      const wrangler = nuxt.options.nitro.cloudflare?.wrangler || {}
      let tomlContent = ''
      // D1 databases
      for (const db of (wrangler.d1_databases || [])) {
        tomlContent += `[[d1_databases]]\nbinding = "${db.binding}"\ndatabase_name = "${db.database_name || 'default'}"\ndatabase_id = "${db.database_id || 'default'}"\nremote = true\n\n`
      }
      // KV namespaces
      for (const kv of (wrangler.kv_namespaces || [])) {
        tomlContent += `[[kv_namespaces]]\nbinding = "${kv.binding}"\nid = "${kv.id}"\nremote = true\n\n`
      }
      // R2 buckets
      for (const r2 of (wrangler.r2_buckets || [])) {
        tomlContent += `[[r2_buckets]]\nbinding = "${r2.binding}"\nbucket_name = "${r2.bucket_name}"\nremote = true\n\n`
      }
      if (tomlContent) {
        await writeFile(wranglerPath, tomlContent, 'utf-8')
        // Store wrangler config for the plugin
        hub._remote = { configPath: wranglerPath, persistDir: hub.dir }
        // Add plugin to inject bindings
        addServerPlugin(resolve('remote/runtime/plugin.dev'))
        // Warn about connecting to remote Cloudflare bindings
        log.warn('REMOTE MODE - Connected to remote Cloudflare bindings (D1/KV/R2)')
      } else {
        log.warn('Remote mode enabled but no Cloudflare bindings configured. Add namespaceId/databaseId/bucketName to your hub config.')
      }
    }

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
