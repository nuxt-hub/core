import { defineNuxtModule, createResolver, logger } from '@nuxt/kit'
import { join } from 'pathe'
import { defu } from 'defu'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { findWorkspaceDir } from 'pkg-types'
import { readUser } from 'rc9'
import { $fetch } from 'ofetch'
import { joinURL } from 'ufo'
import { generateWrangler } from './utils'
import { version } from '../../package.json'
import { argv } from 'node:process'

const log = logger.withScope('nuxt:hub')

export interface ModuleOptions {
  /**
   * Set to `true` to use the remote bindings
   * Please use `nuxthub link` to link the project to a NuxtHub project before using this option
   * @default process.env.NUXT_HUB_REMOTE or --remote option when running `nuxt dev`
   */
  remote?: boolean
  /**
   * The URL of the NuxtHub Console
   * @default 'https://console.hub.nuxt.com'
   */
  url?: string
  /**
   * The project's key on the NuxtHub platform
   * Available when using the NuxtHub platform using `nuxthub link`
   * @default process.env.NUXT_HUB_PROJECT_KEY
   */
  projectKey?: string
  /**
   * The user token to access the NuxtHub platform
   * Available when using the NuxtHub platform using `nuxthub login`
   * @default process.env.NUXT_HUB_USER_TOKEN
   */
  userToken?: string
  /**
   * The URL of the deployed project
   * Available when not using the NuxtHub platform
   * A projectSecretKey must be defined as well
   * @default process.env.NUXT_HUB_PROJECT_URL
   */
  projectUrl?: string
  /**
   * The secret key defined in the deployed project as env variable
   * Available when not using the NuxtHub platform
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

    const runtimeConfig = nuxt.options.runtimeConfig
    const hub = runtimeConfig.hub = defu(runtimeConfig.hub || {}, options, {
      url: process.env.NUXT_HUB_URL || 'https://console.hub.nuxt.com',
      projectKey: process.env.NUXT_HUB_PROJECT_KEY || '',
      projectUrl: process.env.NUXT_HUB_PROJECT_URL || '',
      projectSecretKey: process.env.NUXT_HUB_PROJECT_SECRET_KEY || '',
      userToken: process.env.NUXT_HUB_USER_TOKEN || '',
      remote: argv.includes('--remote') || process.env.NUXT_HUB_REMOTE === 'true',
      version
    })

    // nuxt prepare or production mode, stop here
    if (nuxt.options._prepare || !nuxt.options.dev) {
      return
    }

    // Check if the project is linked to a NuxtHub project
    if (hub.remote && hub.projectKey && !hub.projectUrl) {
      const project = await $fetch(`/api/projects/${hub.projectKey}`, {
        baseURL: hub.url,
        headers: {
          authorization: `Bearer ${hub.userToken}`
        }
      }).catch(() => {
        log.error('Failed to fetch NuxtHub linked project, make sure to run `nuxthub link` again.')
        process.exit(1)
      })
      if (project) {
        const adminUrl = joinURL(hub.url, project.teamSlug, project.slug)
        log.info(`Linked to \`${adminUrl}\``)
        hub.projectUrl = project.url
      }
    }

    if (hub.remote && !hub.projectUrl) {
      log.error('No project URL found, make sure to deploy the project using `nuxthub deploy` or add the deployed URL as `NUXT_HUB_PROJECT_URL` environment variable.')
      process.exit(1)
    }

    if (hub.remote) {
      log.info(`Using remote features from \`${hub.projectUrl}\``)
      const manifest = await $fetch('/api/_hub/manifest', {
        baseURL: hub.projectUrl,
        headers: {
          authorization: `Bearer ${hub.projectSecretKey || hub.userToken}`
        }
      })
        .catch(async (err) => {
          let message = 'Project not found'
          if (err.status >= 500) {
            message = 'Internal server error'
          } else if (err.status === 401) {
            message = 'Authorization failed'
          }
          log.error(`Failed to fetch remote storage: ${message}`)
          process.exit(1)
        })
      if (manifest.version !== hub.version) {
        log.warn(`\`${hub.projectUrl}\` is running \`@nuxthub/core@${manifest.version}\` while the local project is running \`@nuxthub/core@${hub.version}\`. Make sure to use the same version on both sides to avoid issues.`)
      }
      logger.info(`Remote storage available: ${Object.keys(manifest.storage).filter(k => manifest.storage[k]).map(k => `\`${k}\``).join(', ')} `)
      return
    } else {
      log.info('Using local data from `.data/hub`')
    }

    // Local development without remote connection
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
    nuxt.options.runtimeConfig.wrangler = defu(nuxt.options.runtimeConfig.wrangler || {}, {
      configPath: wranglerPath,
      persistDir: hubDir
    })
    // Add server plugin
    nuxt.options.nitro.plugins = nuxt.options.nitro.plugins || []
    nuxt.options.nitro.plugins.push(resolve('./runtime/bindings.dev'))
  }
})


