import { defineNuxtModule, createResolver, logger } from 'nuxt/kit'
import { join } from 'pathe'
import { defu } from 'defu'
import { randomUUID } from 'uncrypto'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { findWorkspaceDir } from 'pkg-types'
import { readUser } from 'rc9'
import { $fetch } from 'ofetch'
import { joinURL } from 'ufo'

const log = logger.withScope('nuxt:hub')

export interface ModuleOptions {
  /**
   * Set to `true` to use the local bindings
   * @default false
   */
  local?: boolean
  /**
   * The URL of the NuxtHub platform
   * @default 'https://hub.nuxt.com'
   */
  url?: string
  /**
   * The ID of the project on the NuxtHub platform
   * Available when using the NuxtHub platform using `nuxthub link`
   * @default process.env.NUXT_HUB_PROJECT_ID
   */
  projectId?: string
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
    name: 'hub'
  },
  defaults: {
    local: false
  },
  async setup (options, nuxt) {
    const rootDir = nuxt.options.rootDir
    const { resolve } = createResolver(import.meta.url)

    // Waiting for https://github.com/unjs/c12/pull/139
    // Then adding the c12 dependency to the project to 1.8.1
    options = defu(options, {
      ...readUser('.nuxtrc').hub,
    })

    const runtimeConfig = nuxt.options.runtimeConfig
    const hub = runtimeConfig.hub = defu(runtimeConfig.hub, options, {
      url: process.env.NUXT_HUB_URL || 'https://hub.nuxt.com',
      projectId: process.env.NUXT_HUB_PROJECT_ID || '',
      projectUrl: process.env.NUXT_HUB_PROJECT_URL || '',
      projectSecretKey: process.env.NUXT_HUB_PROJECT_SECRET_KEY || '',
      userToken: process.env.NUXT_HUB_USER_TOKEN || '',
    })

    // Preapre or Production mode, stop here
    if (nuxt.options._prepare || !nuxt.options.dev) {
      return
    }

    // Check if the project is linked to a NuxtHub project
    if (!hub.local && hub.projectId && /^\d+$/.test(String(hub.projectId))) {
      const project = await $fetch(`/api/projects/${hub.projectId}`, {
        baseURL: hub.url,
        headers: {
          authorization: `Bearer ${hub.userToken}`
        }
      }).catch(() => {
        log.warn('Failed to fetch NuxtHub linked project, make sure to run `nuxthub link` again.')
        return null
      })
      if (project) {
        const adminUrl = joinURL(hub.url, project.teamSlug, project.slug)
        log.info(`Linked to \`${adminUrl}\``)
        hub.projectUrl = project.url
        if (!hub.projectUrl) {
          log.warn(`NuxtHub project \`${project.slug}\` is not deployed yet, make sure to deploy it using \`nuxthub deploy\` or add the deployed URL to the project settings.`)
        }
      }
    }

    if (hub.projectUrl && !hub.local) {
      log.info(`Using remote primitives from \`${hub.projectUrl}\``)
      const primitives = await $fetch('/api/_hub/primitives', {
        baseURL: hub.projectUrl,
        headers: {
          authorization: `Bearer ${hub.projectSecretKey || hub.userToken}`
        }
      })
        .catch((err) => {
          throw new Error(`Failed to fetch remote primitives: ${err?.data?.message || err.message}`)
        })
      logger.info(`Primitives available: ${Object.keys(primitives).filter(k => primitives[k]).map(k => `\`${k}\``).join(', ')} `)
      return
    } else {
      log.info('Using local primitives from `.hub/`')
    }

    // Local development without remote connection
    // Create the .hub/ directory
    const hubDir = join(rootDir, './.hub')
    try {
      await mkdir(hubDir)
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
    if (!gitignore.includes('.hub')) {
      await writeFile(gitignorePath, `${gitignore ? gitignore + '\n' : gitignore}.hub`, 'utf-8')
    }

    // Generate the wrangler.toml file
    const wranglerPath = join(hubDir, './wrangler.toml')
    await writeFile(wranglerPath, DEFAULT_WRANGLER, 'utf-8')
    nuxt.options.runtimeConfig.wrangler = defu(nuxt.options.runtimeConfig.wrangler, {
      configPath: wranglerPath,
      persistDir: hubDir
    })
    // Add server plugin
    nuxt.options.nitro.plugins = nuxt.options.nitro.plugins || []
    nuxt.options.nitro.plugins.push(resolve('./runtime/server/plugins/cloudflare.dev'))

    // Generate the session password
    if (!process.env.NUXT_SESSION_PASSWORD) {
      process.env.NUXT_SESSION_PASSWORD = randomUUID().replace(/-/g, '')
      // Add it to .env
      const envPath = join(rootDir, '.env')
      const envContent = await readFile(envPath, 'utf-8').catch(() => '')
      if (!envContent.includes('NUXT_SESSION_PASSWORD')) {
        await writeFile(envPath, `${envContent ? envContent + '\n' : envContent}NUXT_SESSION_PASSWORD=${process.env.NUXT_SESSION_PASSWORD}`, 'utf-8')
      }
    }
  }
})

const DEFAULT_WRANGLER = `d1_databases = [
  { binding = "DB", database_name = "default", database_id = "default" },
]
kv_namespaces = [
  { binding = "KV", id = "user_default" },
  { binding = "CONFIG", id = "config_default" },
]
r2_buckets = [
  { binding = "BLOB", bucket_name = "default" },
]
analytics_engine_datasets = [
  { binding = "ANALYTICS", dataset = "default" }
]
`
