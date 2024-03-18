import { defineNuxtModule, createResolver, logger, addServerScanDir, installModule } from '@nuxt/kit'
import { join } from 'pathe'
import { defu } from 'defu'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { findWorkspaceDir } from 'pkg-types'
import { readUser } from 'rc9'
import { $fetch } from 'ofetch'
import { joinURL } from 'ufo'
import { parseArgs } from 'citty'
import { generateWrangler } from './utils'
import { version } from '../../package.json'
import { execSync } from 'node:child_process'
import { argv } from 'node:process'

const log = logger.withTag('nuxt:hub')

export interface ModuleOptions {
  /**
   * Set to `true`, 'preview' or 'production' to use the remote storage.
   * Only set the value on a project you are deploying outside of NuxtHub or Cloudflare.
   * Or wrap it with $development to only use it in development mode.
   * @default process.env.NUXT_HUB_REMOTE or --remote option when running `nuxt dev`
   * @see https://hub.nuxt.com/docs/getting-started/remote-storage
   */
  remote?: boolean | 'production' | 'preview',
  /**
   * The URL of the NuxtHub Console
   * @default 'https://console.hub.nuxt.com'
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
  async setup (options, nuxt) {
    const rootDir = nuxt.options.rootDir
    const { resolve } = createResolver(import.meta.url)

    // Waiting for https://github.com/unjs/c12/pull/139
    // Then adding the c12 dependency to the project to 1.8.1
    options = defu(options, {
      ...readUser('.nuxtrc').hub,
    })

    const remoteArg = parseArgs(argv, { remote: { type: 'string' } }).remote as string
    const runtimeConfig = nuxt.options.runtimeConfig
    const hub = runtimeConfig.hub = defu(runtimeConfig.hub || {}, options, {
      url: process.env.NUXT_HUB_URL || 'https://console.hub.nuxt.com',
      projectKey: process.env.NUXT_HUB_PROJECT_KEY || '',
      projectUrl: process.env.NUXT_HUB_PROJECT_URL || '',
      projectSecretKey: process.env.NUXT_HUB_PROJECT_SECRET_KEY || '',
      userToken: process.env.NUXT_HUB_USER_TOKEN || '',
      remote: remoteArg || process.env.NUXT_HUB_REMOTE,
      version
    })
    // validate remote option
    if (hub.remote && !['true', 'production', 'preview'].includes(String(hub.remote))) {
      log.error('Invalid remote option, should be `false`, `true`, `\'production\'` or `\'preview\'`')
      delete hub.remote
    }

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

    // nuxt prepare, stop here
    if (nuxt.options._prepare) {
      return
    }

    if (hub.remote) {
      // Can either use projectKey or projectUrl
      if (hub.projectKey && hub.projectUrl) {
        log.error('You cannot use both NUXT_HUB_PROJECT_KEY and NUXT_HUB_PROJECT_URL at the same time. Please use only one of them.')
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
            log.error('Failed to fetch NuxtHub linked project, make sure to run `nuxthub link` again.')
          }
          process.exit(1)
        })
        let env = hub.remote
        // Guess the environment from the branch name if env is 'true'
        if (env === 'true') {
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
      const manifest = await $fetch('/api/_hub/manifest', {
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
      if (manifest.version !== hub.version) {
        log.warn(`\`${hub.projectUrl}\` is running \`@nuxthub/core@${manifest.version}\` while the local project is running \`@nuxthub/core@${hub.version}\`. Make sure to use the same version on both sides to avoid issues.`)
      }
      logger.info(`Remote storage available: ${Object.keys(manifest.storage).filter(k => manifest.storage[k]).map(k => `\`${k}\``).join(', ')} `)
      return
    }

    // Add Proxy routes only if not remote
    addServerScanDir(resolve('./runtime/server'))

    // Local development without remote connection
    if (nuxt.options.dev) {
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
      const gitignorePath = join(workspaceDir , '.gitignore')
      const gitignore = await readFile(gitignorePath, 'utf-8').catch(() => '')
      if (!gitignore.includes('.data')) {
        await writeFile(gitignorePath, `${gitignore ? gitignore + '\n' : gitignore}.data`, 'utf-8')
      }

      // Generate the wrangler.toml file
      const wranglerPath = join(hubDir, './wrangler.toml')
      await writeFile(wranglerPath, generateWrangler(), 'utf-8')
      // @ts-ignore
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


