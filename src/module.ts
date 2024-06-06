import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { argv } from 'node:process'
import { defineNuxtModule, createResolver, logger, installModule, addServerHandler } from '@nuxt/kit'
import { join } from 'pathe'
import { defu } from 'defu'
import { findWorkspaceDir } from 'pkg-types'
import { parseArgs } from 'citty'
import { version } from '../package.json'
import { generateWrangler } from './utils/wrangler'
import { setupCache, setupBlob, setupOpenAPI, setupDatabase, setupKV, setupBase, setupRemote } from './utils/features'

const log = logger.withTag('nuxt:hub')

export interface ModuleOptions {
  /**
   * Set `true` to enable the analytics for the project.
   *
   * @default false
   */
  analytics?: boolean
  /**
   * Set `true` to enable the Blob storage for the project.
   *
   * @default false
   */
  blob?: boolean
  /**
   * Set `true` to enable caching for the project.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/storage/blob
   */
  cache?: boolean
  /**
   * Set `true` to enable the database for the project.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/storage/database
   */
  database?: boolean
  /**
   * Set `true` to enable the Key-Value storage for the project.
   *
   * @default false
   * @see https://hub.nuxt.com/docs/storage/kv
   */
  kv?: boolean
  /**
   * Set to `true`, 'preview' or 'production' to use the remote storage.
   * Only set the value on a project you are deploying outside of NuxtHub or Cloudflare.
   * Or wrap it with $development to only use it in development mode.
   * @default process.env.NUXT_HUB_REMOTE or --remote option when running `nuxt dev`
   * @see https://hub.nuxt.com/docs/getting-started/remote-storage
   */
  remote?: boolean | 'production' | 'preview'
  /**
   * The URL of the NuxtHub Admin
   * @default 'https://admin.hub.nuxt.com'
   */
  url?: string
  /**
   * The project's key on the NuxtHub platform, added with `nuxthub link`.
   * @default process.env.NUXT_HUB_PROJECT_KEY
   */
  projectKey?: string
  /**
   * The user token to access the NuxtHub platform, added with `nuxthub login`
   * @default process.env.NUXT_HUB_USER_TOKEN
   */
  userToken?: string
  /**
   * The URL of the deployed project, used to fetch the remote storage.
   * @default process.env.NUXT_HUB_PROJECT_URL
   */
  projectUrl?: string | (({ env, branch }: { env: 'production' | 'preview', branch: string }) => string)
  /**
   * The secret key defined in the deployed project as env variable, used to fetch the remote storage from the projectUrl
   * @default process.env.NUXT_HUB_PROJECT_SECRET_KEY
   */
  projectSecretKey?: string
  /**
   * The directory used for storage (D1, KV, R2, etc.) in development mode.
   * @default '.data/hub'
   */
  dir?: string
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@nuxthub/core',
    configKey: 'hub',
    version
  },
  defaults: {},
  async setup(options, nuxt) {
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
      analytics: false,
      blob: false,
      cache: false,
      database: false,
      kv: false,
      // Other options
      version,
      env: process.env.NUXT_HUB_ENV || 'production',
      openapi: nuxt.options.nitro.experimental?.openAPI === true
    })
    runtimeConfig.hub = hub
    // validate remote option
    if (hub.remote && !['true', 'production', 'preview'].includes(String(hub.remote))) {
      log.error('Invalid remote option, should be `false`, `true`, `\'production\'` or `\'preview\'`')
      hub.remote = false
    }
    // Log when using a different Hub url
    if (hub.url !== 'https://admin.hub.nuxt.com') {
      log.info(`Using \`${hub.url}\` as NuxtHub Admin URL`)
    }

    // nuxt prepare, stop here
    if (nuxt.options._prepare) {
      return
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
    hub.blob && setupBlob(nuxt)
    hub.cache && setupCache(nuxt)
    hub.database && setupDatabase(nuxt)
    hub.kv && setupKV(nuxt)

    if (hub.remote) {
      await setupRemote(nuxt, hub)
      return
    }

    // Folowing lines are only executed when remove storage is disabled

    if (!nuxt.options.dev) {
      // Make sure to fallback to cloudflare-pages preset
      let preset = nuxt.options.nitro.preset = nuxt.options.nitro.preset || 'cloudflare-pages'
      // Support also cloudflare_module
      preset = String(preset).replace('_', '-')

      if (preset !== 'cloudflare-pages' && preset !== 'cloudflare-module') {
        log.error('NuxtHub is only compatible with the `cloudflare-pages` and `cloudflare-module` presets.')
        process.exit(1)
      }
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

      // Generate the wrangler.toml file
      const wranglerPath = join(hubDir, './wrangler.toml')
      await writeFile(wranglerPath, generateWrangler(hub), 'utf-8')
      // @ts-expect-error cloudflareDev is not typed here
      nuxt.options.nitro.cloudflareDev = {
        persistDir: hubDir,
        configPath: wranglerPath,
        silent: true
      }
      await installModule('nitro-cloudflare-dev')
      nuxt.options.nitro.plugins = nuxt.options.nitro.plugins || []
      nuxt.options.nitro.plugins.push(resolve('./runtime/ready.dev'))
    }
  }
})
