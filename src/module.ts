import { writeFile, readFile } from 'node:fs/promises'
import { argv } from 'node:process'
import { defineNuxtModule, createResolver, logger, installModule, addServerHandler, addServerPlugin } from '@nuxt/kit'
import { join, relative } from 'pathe'
import { defu } from 'defu'
import { findWorkspaceDir } from 'pkg-types'
import { parseArgs } from 'citty'
import type { Nuxt } from '@nuxt/schema'
import { version } from '../package.json'
import { generateWrangler } from './utils/wrangler'
import { setupAI, setupCache, setupAnalytics, setupBlob, setupBrowser, setupOpenAPI, setupDatabase, setupKV, setupVectorize, setupBase, setupRemote, vectorizeRemoteCheck, type HubConfig } from './features'
import type { ModuleOptions } from './types/module'
import { addBuildHooks, getNitroPreset } from './utils/build'

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
    if (nuxt.options._generate) {
      log.error('NuxtHub is not compatible with `nuxt generate` as it needs a server to run.')
      log.info('To pre-render all pages: `https://hub.nuxt.com/docs/recipes/pre-rendering#pre-render-all-pages`')
      return process.exit(1)
    }

    const rootDir = nuxt.options.rootDir
    const { resolve } = createResolver(import.meta.url)

    const cliArgs = parseArgs(argv, {
      remote: { type: 'string' },
      hubEnv: { type: 'string' }
    })
    const remoteArg = cliArgs.remote === '' ? 'true' : cliArgs.remote
    const runtimeConfig = nuxt.options.runtimeConfig
    const databaseMigrationsDirs = nuxt.options._layers?.map(layer => join(layer.config.serverDir!, 'database/migrations')).filter(Boolean)
    const hub = defu(runtimeConfig.hub || {}, options, {
      // Self-hosted project
      projectUrl: process.env.NUXT_HUB_PROJECT_URL || '',
      projectSecretKey: process.env.NUXT_HUB_PROJECT_SECRET_KEY || '',
      // Deployed on NuxtHub
      url: process.env.NUXT_HUB_URL || 'https://admin.hub.nuxt.com',
      projectKey: process.env.NUXT_HUB_PROJECT_KEY || '',
      userToken: process.env.NUXT_HUB_USER_TOKEN || '',
      // Remote storage
      remote: (remoteArg || process.env.NUXT_HUB_REMOTE) as string | boolean,
      remoteManifest: undefined,
      // Local storage
      dir: '.data/hub',
      // Workers support
      workers: false,
      // NuxtHub features
      ai: false,
      analytics: false,
      blob: false,
      browser: false,
      cache: false,
      database: false,
      kv: false,
      vectorize: {},
      // Database Migrations
      databaseMigrationsDirs,
      databaseQueriesPaths: [],
      // Other options
      version,
      env: process.env.NUXT_HUB_ENV || (cliArgs.hubEnv as string) || 'production',
      openapi: nuxt.options.nitro.experimental?.openAPI === true,
      // Extra bindings for the project
      bindings: {
        hyperdrive: {},
        compatibilityFlags: nuxt.options.nitro.cloudflare?.wrangler?.compatibility_flags
      },
      // Cloudflare Access
      cloudflareAccess: {
        clientId: process.env.NUXT_HUB_CLOUDFLARE_ACCESS_CLIENT_ID || null,
        clientSecret: process.env.NUXT_HUB_CLOUDFLARE_ACCESS_CLIENT_SECRET || null
      }
    })
    if (!['test', 'preview', 'production'].includes(hub.env)) {
      log.error('Invalid hub environment, should be `test`, `preview` or `production`')
      process.exit(1)
    }
    // If testing environment detects, set the hub env to `test`
    if (nuxt.options.test) {
      hub.env = 'test'
    }
    if (hub.env === 'test') {
      log.info('NuxtHub test environment detected, using `test` dataset for all storage & disabling remote storage.')
      hub.remote = false
    }
    runtimeConfig.hub = hub
    runtimeConfig.public.hub = {}
    // Make sure to tell Nitro to not generate the .wrangler/deploy/config.json file
    nuxt.options.nitro.cloudflare ||= {}
    // @ts-expect-error deployConfig is not typed here
    nuxt.options.nitro.cloudflare.deployConfig = false
    // @ts-expect-error nodeCompat is not typed here
    nuxt.options.nitro.cloudflare.nodeCompat = true
    // For old versions of Nitro, disable generating the wrangler.toml file
    delete nuxt.options.nitro.cloudflare?.wrangler?.compatibility_flags
    if (nuxt.options.nitro.cloudflare?.wrangler && Object.keys(nuxt.options.nitro.cloudflare.wrangler).length) {
      log.warn('The `nitro.cloudflare.wrangler` defined options are not supported by NuxtHub, ignoring...')
      nuxt.options.nitro.cloudflare.wrangler = {}
    }
    // validate remote option
    if (hub.remote && !['true', 'production', 'preview'].includes(String(hub.remote))) {
      log.error('Invalid remote option, should be `false`, `true`, `\'production\'` or `\'preview\'`')
      hub.remote = false
    }
    // Log when using a different Hub url
    if (hub.url !== 'https://admin.hub.nuxt.com') {
      log.info(`Using \`${hub.url}\` as NuxtHub Admin URL`)
    }

    // Register a server middleware to handle cors requests in devtools
    if (nuxt.options.dev) {
      addServerHandler({
        route: '/api/_hub',
        middleware: true,
        handler: resolve('./runtime/cors.dev')
      })
    }

    await setupBase(nuxt, hub as HubConfig)
    hub.openapi && setupOpenAPI(nuxt, hub as HubConfig)
    hub.ai && await setupAI(nuxt, hub as HubConfig)
    hub.analytics && setupAnalytics(nuxt)
    hub.blob && setupBlob(nuxt)
    hub.browser && await setupBrowser(nuxt)
    hub.cache && await setupCache(nuxt)
    hub.database && await setupDatabase(nuxt, hub as HubConfig)
    hub.kv && setupKV(nuxt)
    Object.keys(hub.vectorize!).length && setupVectorize(nuxt, hub as HubConfig)

    // nuxt prepare, stop here
    if (nuxt.options._prepare) {
      return
    }

    addBuildHooks(nuxt, hub as HubConfig)

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
    nuxt.options.nitro.experimental = nuxt.options.nitro.experimental || {}
    nuxt.options.nitro.experimental.asyncContext = true
    nuxt.options.nitro.unenv = nuxt.options.nitro.unenv || {}
    nuxt.options.nitro.unenv.external = nuxt.options.nitro.unenv.external || []
    if (!nuxt.options.nitro.unenv.external.includes('node:async_hooks')) {
      nuxt.options.nitro.unenv.external.push('node:async_hooks')
    }

    if (hub.remote) {
      await setupRemote(nuxt, hub as HubConfig)
      vectorizeRemoteCheck(hub as HubConfig)
    }

    // Production mode without remote storage
    if (!hub.remote && !nuxt.options.dev) {
      nuxt.options.nitro.preset = getNitroPreset(hub, nuxt.options.nitro)

      if (!['cloudflare_pages', 'cloudflare_module', 'cloudflare_durable'].includes(nuxt.options.nitro.preset)) {
        log.error('NuxtHub is only compatible with the `cloudflare_pages`, `cloudflare_module` or `cloudflare_durable` presets.')
        process.exit(1)
      }

      // @ts-expect-error compatibilityDate is not properly typed
      if (nuxt.options.nitro.preset !== 'cloudflare_pages' && nuxt.options.compatibilityDate?.default && nuxt.options.compatibilityDate.default < '2024-11-20') {
        log.warn('Found a compatibility date in `nuxt.config.ts` earlier than `2024-09-19`, forcing it to `2024-09-19`. Please update your `nuxt.config.ts` file.')
        // @ts-expect-error compatibilityDate is not properly typed
        nuxt.options.compatibilityDate.default = '2024-09-19'
      }

      // Make sure to always set the output to dist/
      nuxt.options.nitro.output ||= {}
      nuxt.options.nitro.output.dir = 'dist'

      // Update the deploy command displayed in the console
      nuxt.options.nitro.commands = nuxt.options.nitro.commands || {}
      nuxt.options.nitro.commands.preview = 'npx nuxthub preview'
      nuxt.options.nitro.commands.deploy = 'npx nuxthub deploy'

      // Add node:stream to unenv external (only for Cloudflare Pages/Workers)
      if (!nuxt.options.nitro.unenv.external.includes('node:stream')) {
        nuxt.options.nitro.unenv.external.push('node:stream')
      }
      if (!nuxt.options.nitro.unenv.external.includes('node:process')) {
        nuxt.options.nitro.unenv.external.push('node:process')
      }
      // Add safer-buffer as alias to node:buffer
      nuxt.options.nitro.unenv.alias ||= {}
      if (!nuxt.options.nitro.unenv.alias['safer-buffer']) {
        nuxt.options.nitro.unenv.alias['safer-buffer'] = 'node:buffer'
      }

      // Add the env middleware
      nuxt.options.nitro.handlers ||= []
      nuxt.options.nitro.handlers.unshift({
        middleware: true,
        handler: resolve('./runtime/env')
      })
    }

    // Local development
    if (nuxt.options.dev) {
      if (!hub.remote) {
        log.info(`Using local storage from \`${relative(nuxt.options.rootDir, hub.dir)}\``)
      }

      const workspaceDir = await findWorkspaceDir(rootDir)
      // Add it to .gitignore
      const gitignorePath = join(workspaceDir, '.gitignore')
      const gitignore = await readFile(gitignorePath, 'utf-8').catch(() => '')
      if (!gitignore.includes('.data')) {
        await writeFile(gitignorePath, `${gitignore ? gitignore + '\n' : gitignore}.data`, 'utf-8')
      }

      const needWrangler = Boolean(hub.analytics || hub.blob || hub.database || hub.kv || hub.cache)
      // const needWrangler = Boolean(hub.analytics || hub.blob || hub.database || hub.kv || Object.keys(hub.bindings.hyperdrive).length > 0)
      if (needWrangler) {
        // Generate the wrangler.toml file
        const wranglerPath = join(hub.dir, './wrangler.toml')
        await writeFile(wranglerPath, generateWrangler(nuxt, hub as HubConfig), 'utf-8')
        // @ts-expect-error cloudflareDev is not typed here
        nuxt.options.nitro.cloudflareDev = {
          persistDir: hub.dir,
          configPath: wranglerPath,
          silent: true
        }
        await installModule('nitro-cloudflare-dev')
      }
      addServerPlugin(resolve('./runtime/ready.dev'))
    }
  }
})
