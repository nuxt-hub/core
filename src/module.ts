import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { execSync } from 'node:child_process'
import { argv } from 'node:process'
import { defineNuxtModule, createResolver, logger, addServerScanDir, installModule, addServerImportsDir, addImportsDir } from '@nuxt/kit'
import { join } from 'pathe'
import { defu } from 'defu'
import { findWorkspaceDir } from 'pkg-types'
import { $fetch } from 'ofetch'
import { joinURL } from 'ufo'
import { parseArgs } from 'citty'
import { version } from '../package.json'
import { addDevtoolsCustomTabs, generateWrangler } from './utils'

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
   * The URL of the deployed project, used to fetch the remote storage, a projectKey must be defined as well
   * @default process.env.NUXT_HUB_PROJECT_URL
   */
  projectUrl?: string
  /**
   * The secret key defined in the deployed project as env variable, used to fetch the remote storage from the projectUrl
   * @default process.env.NUXT_HUB_PROJECT_SECRET_KEY
   */
  projectSecretKey?: string
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
    const hub = runtimeConfig.hub = defu(runtimeConfig.hub || {}, options, {
      // Self-hosted project
      projectUrl: process.env.NUXT_HUB_PROJECT_URL || '',
      projectSecretKey: process.env.NUXT_HUB_PROJECT_SECRET_KEY || '',
      // Deployed on NuxtHub
      url: process.env.NUXT_HUB_URL || 'https://admin.hub.nuxt.com',
      projectKey: process.env.NUXT_HUB_PROJECT_KEY || '',
      userToken: process.env.NUXT_HUB_USER_TOKEN || '',
      // Remote storage
      remote: remoteArg || process.env.NUXT_HUB_REMOTE,
      remoteManifest: undefined,
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
    // validate remote option
    if (hub.remote && !['true', 'production', 'preview'].includes(String(hub.remote))) {
      log.error('Invalid remote option, should be `false`, `true`, `\'production\'` or `\'preview\'`')
      delete hub.remote
      delete hub.remoteManifest
    }
    // Log when using a different Hub url
    if (hub.url !== 'https://admin.hub.nuxt.com') {
      log.info(`Using \`${hub.url}\` as NuxtHub Admin URL`)
    }

    if (hub.cache) {
      // Add Server caching (Nitro)
      nuxt.options.nitro = defu(nuxt.options.nitro, {
        storage: {
          cache: {
            driver: 'cloudflare-kv-binding',
            binding: 'CACHE',
            base: 'cache'
          }
        },
        devStorage: {
          cache: {
            driver: 'fs',
            base: join(rootDir, '.data/cache')
          }
        }
      })
    }

    // nuxt prepare, stop here
    if (nuxt.options._prepare) {
      return
    }

    // Fallback to custom placeholder when openAPI is disabled
    nuxt.options.alias['#hub/openapi'] = nuxt.options.nitro?.experimental?.openAPI === true
      ? '#internal/nitro/routes/openapi'
      : resolve('./runtime/templates/openapi')

    // Register composables
    addServerImportsDir(resolve('./runtime/server/utils'))
    addImportsDir(resolve('./runtime/composables'))

    // Within CF Pages CI/CD to notice NuxtHub about the build and hub config
    if (!nuxt.options.dev && process.env.CF_PAGES && process.env.NUXT_HUB_PROJECT_DEPLOY_TOKEN && process.env.NUXT_HUB_PROJECT_KEY && process.env.NUXT_HUB_ENV) {
      // Disable remote option (if set also for prod)
      hub.remote = false
      // Wait for modules to be done to send config to NuxtHub
      nuxt.hook('modules:done', async () => {
        const { bindingsChanged } = await $fetch<{ bindingsChanged: boolean }>(`/api/projects/${process.env.NUXT_HUB_PROJECT_KEY}/build/${process.env.NUXT_HUB_ENV}/before`, {
          baseURL: hub.url,
          method: 'POST',
          headers: {
            authorization: `Bearer ${process.env.NUXT_HUB_PROJECT_DEPLOY_TOKEN}`
          },
          body: {
            pagesUrl: process.env.CF_PAGES_URL,
            analytics: hub.analytics,
            blob: hub.blob,
            cache: hub.cache,
            database: hub.database,
            kv: hub.kv
          }
        }).catch((e) => {
          if (e.response?._data?.message) {
            log.error(e.response._data.message)
          } else {
            log.error('Failed run build:before hook on NuxtHub.', e)
          }

          process.exit(1)
        })

        if (bindingsChanged) {
          log.box([
            'NuxtHub detected some changes in this project bindings and updated your Pages project on your Cloudflare account.',
            'In order to enable this changes, this deployment will be cancelled and a new one has been created.'
          ].join('\n'))

          // Wait 2 seconds to make sure NuxtHub cancel the deployment before exiting
          await new Promise(resolve => setTimeout(resolve, 2000))

          process.exit(1)
        }
      })

      nuxt.hook('build:done', async () => {
        await $fetch(`/api/projects/${process.env.NUXT_HUB_PROJECT_KEY}/build/${process.env.NUXT_HUB_ENV}/done`, {
          baseURL: hub.url,
          method: 'POST',
          headers: {
            authorization: `Bearer ${process.env.NUXT_HUB_PROJECT_DEPLOY_TOKEN}`
          },
          body: {
            pagesUrl: process.env.CF_PAGES_URL
          }
        }).catch((e) => {
          if (e.response?._data?.message) {
            log.error(e.response._data.message)
          } else {
            log.error('Failed run build:done hook on NuxtHub.', e)
          }

          process.exit(1)
        })
      })
    } else {
      // Write `dist/hub.config.json` after public assets are built
      nuxt.hook('nitro:build:public-assets', async (nitro) => {
        const hubConfig = {
          analytics: hub.analytics,
          blob: hub.blob,
          cache: hub.cache,
          database: hub.database,
          kv: hub.kv
        }
        await writeFile(join(nitro.options.output.publicDir, 'hub.config.json'), JSON.stringify(hubConfig, null, 2), 'utf-8')
      })
    }

    if (hub.remote) {
      // Can either use projectKey or projectUrl
      if (hub.projectKey && hub.projectUrl) {
        log.error('You cannot use both `NUXT_HUB_PROJECT_KEY` and `NUXT_HUB_PROJECT_URL` at the same time. Please use only one of them.')
        process.exit(1)
      }
      // Check if the project is linked to a NuxtHub project
      // it should have a projectKey and a userToken
      // Then we fill the projectUrl
      if (hub.projectKey) {
        const project = await $fetch(`/api/projects/${hub.projectKey}`, {
          baseURL: hub.url,
          headers: {
            authorization: `Bearer ${hub.userToken}`
          }
        }).catch((err) => {
          if (err.status === 401) {
            log.error('It seems that you are not logged in, make sure to run `nuxthub login`.')
          } else {
            log.error('Failed to fetch linked project on NuxtHub, make sure to run `nuxthub link` again.')
          }
          process.exit(1)
        })
        let env = hub.remote
        // Guess the environment from the branch name if env is 'true'
        if (String(env) === 'true') {
          try {
            const branch = execSync('git branch --show-current', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
            env = (branch === project.productionBranch ? 'production' : 'preview')
          } catch {
            // ignore
            log.warn('Could not guess the environment from the branch name, using `production` as default')
            env = 'production'
          }
        }
        const adminUrl = joinURL(hub.url, project.teamSlug, project.slug)
        log.info(`Linked to \`${adminUrl}\``)
        log.info(`Using \`${env}\` environment`)
        hub.projectUrl = (env === 'production' ? project.url : project.previewUrl)
        if (!hub.projectUrl) {
          log.error(`No deployment found for \`${env}\`, make sure to deploy the project using \`nuxthub deploy\`.`)
          process.exit(1)
        }
        // Update hub.env in runtimeConfig
        hub.env = env
      }

      // Make sure we have a projectUrl when using the remote option
      if (!hub.projectUrl) {
        log.error('No project URL found, make sure to deploy the project using `nuxthub deploy` or link your project with `nuxthub link` or add the deployed URL as `NUXT_HUB_PROJECT_URL` environment variable (if self-hosted).')
        process.exit(1)
      }

      // Make sure we have a secret when using the remote option
      if (!hub.projectKey && !hub.projectSecretKey && !hub.userToken) {
        log.error('No project secret key found, make sure to add the `NUXT_HUB_PROJECT_SECRET_KEY` environment variable.')
        process.exit(1)
      }

      // If using the remote option with a projectUrl and a projectSecretKey
      log.info(`Using remote storage from \`${hub.projectUrl}\``)
      const remoteManifest = hub.remoteManifest = await $fetch('/api/_hub/manifest', {
        baseURL: hub.projectUrl,
        headers: {
          authorization: `Bearer ${hub.projectSecretKey || hub.userToken}`
        }
      })
        .catch(async (err) => {
          let message = 'Project not found.\nMake sure to deploy the project using `nuxthub deploy` or add the deployed URL as `NUXT_HUB_PROJECT_URL` environment variable.'
          if (err.status >= 500) {
            message = 'Internal server error'
          } else if (err.status === 401) {
            message = 'Authorization failed.\nMake sure to provide a valid NUXT_HUB_PROJECT_SECRET_KEY or being logged in with `nuxthub login`'
          }
          log.error(`Failed to fetch remote storage: ${message}`)
          process.exit(1)
        })
      if (remoteManifest.version !== hub.version) {
        log.warn(`\`${hub.projectUrl}\` is running \`@nuxthub/core@${remoteManifest.version}\` while the local project is running \`@nuxthub/core@${hub.version}\`. Make sure to use the same version on both sides for a smooth experience.`)
      }

      Object.keys(remoteManifest.storage).filter(k => hub[k as keyof typeof hub] && !remoteManifest.storage[k]).forEach((k) => {
        if (!remoteManifest.storage[k]) {
          log.warn(`Remote storage \`${k}\` is enabled locally but it's not enabled in the remote project. Deploy a new version with \`${k}\` enabled to use it remotely.`)
        }
      })

      const availableStorages = Object.keys(remoteManifest.storage).filter(k => hub[k as keyof typeof hub] && remoteManifest.storage[k])
      if (availableStorages.length > 0) {
        logger.info(`Remote storage available: ${availableStorages.map(k => `\`${k}\``).join(', ')} `)
      } else {
        log.fatal('No remote storage available: make sure to enable at least one of the storage options in your `nuxt.config.ts` and deploy new version before using remote storage. Read more at https://hub.nuxt.com/docs/getting-started/remote-storage')
        process.exit(1)
      }
    }

    // Add Proxy routes only if not remote or in development (used for devtools)
    if (nuxt.options.dev || !hub.remote) {
      addServerScanDir(resolve('./runtime/server'))
    }

    // Add custom tabs to Nuxt Devtools
    if (nuxt.options.dev) {
      addDevtoolsCustomTabs(nuxt, hub)
    }

    // Local development without remote connection
    if (nuxt.options.dev && !hub.remote) {
      log.info('Using local storage from `.data/hub`')

      // Create the .data/hub/ directory
      const hubDir = join(rootDir, './.data/hub')
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
