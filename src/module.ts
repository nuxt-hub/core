import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { argv } from 'node:process'
import { defineNuxtModule, createResolver, logger, installModule, addServerHandler, addServerPlugin } from '@nuxt/kit'
import { join } from 'pathe'
import { defu } from 'defu'
import { findWorkspaceDir } from 'pkg-types'
import { parseArgs } from 'citty'
import type { Nuxt } from '@nuxt/schema'
import { version } from '../package.json'
import { generateWrangler } from './utils/wrangler'
import { setupAI, setupCache, setupAnalytics, setupBlob, setupBrowser, setupOpenAPI, setupDatabase, setupKV, setupVectorize, setupBase, setupRemote, vectorizeRemoteCheck } from './features'
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
    if (nuxt.options._generate) {
      log.error('NuxtHub is not compatible with `nuxt generate` as it needs a server to run.')
      log.info('To pre-render all pages: `https://hub.nuxt.com/docs/recipes/pre-rendering#pre-render-all-pages`')
      return process.exit(1)
    }

    const rootDir = nuxt.options.rootDir
    const { resolve } = createResolver(import.meta.url)

    let remoteArg = parseArgs(argv, { remote: { type: 'string' } }).remote as string
    remoteArg = (remoteArg === '' ? 'true' : remoteArg)
    const runtimeConfig = nuxt.options.runtimeConfig
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
      // NuxtHub features
      ai: false,
      analytics: false,
      blob: false,
      browser: false,
      cache: false,
      database: false,
      kv: false,
      vectorize: {},
      // Other options
      version,
      env: process.env.NUXT_HUB_ENV || 'production',
      openapi: nuxt.options.nitro.experimental?.openAPI === true,
      // Extra bindings for the project
      bindings: {
        hyperdrive: {},
        // @ts-expect-error nitro.cloudflare.wrangler is not yet typed
        compatibilityFlags: nuxt.options.nitro.cloudflare?.wrangler?.compatibility_flags
      }
    })
    runtimeConfig.hub = hub
    // Make sure to tell Nitro to not generate the wrangler.toml file
    // @ts-expect-error nitro.cloudflare.wrangler is not yet typed
    delete nuxt.options.nitro.cloudflare?.wrangler?.compatibility_flags
    // @ts-expect-error nitro.cloudflare.wrangler is not yet typed
    if (nuxt.options.nitro.cloudflare?.wrangler && Object.keys(nuxt.options.nitro.cloudflare.wrangler).length) {
      log.warn('The `nitro.cloudflare.wrangler` defined options are not supported by NuxtHub, ignoring...')
      // @ts-expect-error nitro.cloudflare.wrangler is not yet typed
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

    setupBase(nuxt, hub)
    setupOpenAPI(nuxt)
    hub.ai && await setupAI(nuxt, hub)
    hub.analytics && setupAnalytics(nuxt)
    hub.blob && setupBlob(nuxt)
    hub.browser && await setupBrowser(nuxt)
    hub.cache && setupCache(nuxt)
    hub.database && setupDatabase(nuxt)
    hub.kv && setupKV(nuxt)
    Object.keys(hub.vectorize).length && setupVectorize(nuxt, hub)

    // nuxt prepare, stop here
    if (nuxt.options._prepare) {
      return
    }

    addBuildHooks(nuxt, hub)

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
      await setupRemote(nuxt, hub)
      vectorizeRemoteCheck(hub, log)
      return
    }

    // Add node:stream to unenv external (only for Cloudflare Pages/Workers)
    if (!nuxt.options.nitro.unenv.external.includes('node:stream')) {
      nuxt.options.nitro.unenv.external.push('node:stream')
    }

    // Folowing lines are only executed when remote storage is disabled

    // Production mode without remote storage
    if (!nuxt.options.dev) {
      // Make sure to fallback to cloudflare-pages preset
      let preset = nuxt.options.nitro.preset = nuxt.options.nitro.preset || 'cloudflare-pages'
      // Support also cloudflare_module
      preset = String(preset).replace('_', '-')

      if (preset !== 'cloudflare-pages' && preset !== 'cloudflare-module') {
        log.error('NuxtHub is only compatible with the `cloudflare-pages` and `cloudflare-module` presets.')
        process.exit(1)
      }

      // Update the deploy command displayed in the console
      nuxt.options.nitro.commands = nuxt.options.nitro.commands || {}
      nuxt.options.nitro.commands.preview = 'npx nuxthub preview'
      nuxt.options.nitro.commands.deploy = 'npx nuxthub deploy'

      // Add the env middleware
      nuxt.options.nitro.handlers ||= []
      nuxt.options.nitro.handlers.unshift({
        middleware: true,
        handler: resolve('./runtime/env')
      })
    }

    // Local development without remote connection
    if (nuxt.options.dev) {
      log.info(`Using local storage from \`${hub.dir}\``)

      // Create the hub.dir directory
      const hubDir = join(rootDir, hub.dir)
      try {
        await mkdir(hubDir, { recursive: true })
      } catch (e: any) {
        if (e.errno === -17) {
          // File already exists
        } else {
          throw e
        }
      }
      const workspaceDir = await findWorkspaceDir(rootDir)
      // Add it to .gitignore
      const gitignorePath = join(workspaceDir, '.gitignore')
      const gitignore = await readFile(gitignorePath, 'utf-8').catch(() => '')
      if (!gitignore.includes('.data')) {
        await writeFile(gitignorePath, `${gitignore ? gitignore + '\n' : gitignore}.data`, 'utf-8')
      }

      const needWrangler = Boolean(hub.ai || hub.analytics || hub.blob || hub.database || hub.kv)
      // const needWrangler = Boolean(hub.ai || hub.analytics || hub.blob || hub.database || hub.kv || Object.keys(hub.bindings.hyperdrive).length > 0)
      if (needWrangler) {
        // Generate the wrangler.toml file
        const wranglerPath = join(hubDir, './wrangler.toml')
        await writeFile(wranglerPath, generateWrangler(nuxt, hub), 'utf-8')
        // @ts-expect-error cloudflareDev is not typed here
        nuxt.options.nitro.cloudflareDev = {
          persistDir: hubDir,
          configPath: wranglerPath,
          silent: true
        }
        await installModule('nitro-cloudflare-dev')
      }
      addServerPlugin(resolve('./runtime/ready.dev'))
    }
  }
})
