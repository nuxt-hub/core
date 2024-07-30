import { execSync } from 'node:child_process'
import { type Nuxt } from '@nuxt/schema'
import { logger, addImportsDir, addServerImportsDir, addServerScanDir, createResolver } from '@nuxt/kit'
import { joinURL } from 'ufo'
import { join } from 'pathe'
import { defu } from 'defu'
import { $fetch } from 'ofetch'
import { addDevtoolsCustomTabs } from './utils/devtools'

const log = logger.withTag('nuxt:hub')
const { resolve } = createResolver(import.meta.url)

export interface HubConfig {
  remote: string | boolean
  url: string
  projectUrl?: string | ((args: { env: string, branch: string }) => string)
  projectKey?: string
  projectSecretKey?: string
  userToken?: string
  env?: string
  version?: string

  ai?: boolean
  analytics?: boolean
  blob?: boolean
  cache?: boolean
  database?: boolean
  kv?: boolean

  remoteManifest?: {
    version: string
    storage: {
      [key: string]: boolean
    }
  }
}

export function setupBase(nuxt: Nuxt, hub: HubConfig) {
  // Add Server scanning
  addServerScanDir(resolve('./runtime/base/server'))
  addServerImportsDir(resolve('./runtime/base/server/utils'))

  // Add custom tabs to Nuxt Devtools
  if (nuxt.options.dev) {
    addDevtoolsCustomTabs(nuxt, hub)
  }
}

export function setupAI(_nuxt: Nuxt) {
  // Add Server scanning
  addServerScanDir(resolve('./runtime/ai/server'))
  addServerImportsDir(resolve('./runtime/ai/server/utils'))
}

export function setupAnalytics(_nuxt: Nuxt) {
  // Add Server scanning
  addServerScanDir(resolve('./runtime/analytics/server'))
  addServerImportsDir(resolve('./runtime/analytics/server/utils'))
}

export function setupBlob(_nuxt: Nuxt) {
  // Add Server scanning
  addServerScanDir(resolve('./runtime/blob/server'))
  addServerImportsDir(resolve('./runtime/blob/server/utils'))

  // Add Composables
  addImportsDir(resolve('./runtime/blob/app/composables'))
}

export function setupCache(nuxt: Nuxt) {
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
        base: join(nuxt.options.rootDir, '.data/cache')
      }
    }
  })

  // Add Server scanning
  addServerScanDir(resolve('./runtime/cache/server'))
}

export function setupDatabase(_nuxt: Nuxt) {
  // Add Server scanning
  addServerScanDir(resolve('./runtime/database/server'))
  addServerImportsDir(resolve('./runtime/database/server/utils'))
}

export function setupKV(_nuxt: Nuxt) {
  // Add Server scanning
  addServerScanDir(resolve('./runtime/kv/server'))
  addServerImportsDir(resolve('./runtime/kv/server/utils'))
}

export function setupOpenAPI(nuxt: Nuxt) {
  // Fallback to custom placeholder when openAPI is disabled
  nuxt.options.alias['#hub/openapi'] = nuxt.options.nitro?.experimental?.openAPI === true
    ? '#internal/nitro/routes/openapi'
    : resolve('./runtime/openapi/server/templates/openapi')

  addServerScanDir(resolve('./runtime/openapi/server'))
}

export async function setupRemote(_nuxt: Nuxt, hub: HubConfig) {
  let env = hub.remote
  // Guess the environment from the branch name if env is 'true'
  let branch = 'main'
  if (String(env) === 'true') {
    try {
      branch = execSync('git branch --show-current', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
      env = (branch === 'main' ? 'production' : 'preview')
    } catch {
      // ignore
      log.warn('Could not guess the environment from the branch name, using `production` as default')
      env = 'production'
    }
  }

  // If projectUrl is a function and we cannot know the productionBranch
  if (typeof hub.projectUrl === 'function' && !hub.projectKey) {
    // @ts-expect-error issue with defu transform
    hub.projectUrl = hub.projectUrl({ env, branch })
  }

  // Check if the project is linked to a NuxtHub project
  // it should have a projectKey and a userToken
  // Then we fill the projectUrl
  if (hub.projectKey) {
    if (hub.projectSecretKey) {
      log.warn('Ignoring `NUXT_HUB_PROJECT_SECRET_KEY` as `NUXT_HUB_PROJECT_KEY` is set.')
    }

    const project = await $fetch<any>(`/api/projects/${hub.projectKey}`, {
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

    // Adapt env based on project defined production branch
    env = (branch === project.productionBranch ? 'production' : 'preview')
    if (typeof hub.projectUrl === 'function') {
      hub.projectUrl = hub.projectUrl({ env, branch })
    }

    const adminUrl = joinURL(hub.url, project.teamSlug, project.slug)
    log.info(`Linked to \`${adminUrl}\``)
    log.info(`Using \`${env}\` environment`)
    hub.projectUrl = hub.projectUrl || (env === 'production' ? project.url : project.previewUrl)
    // No production or preview URL found
    if (!hub.projectUrl) {
      log.error(`No deployment found for \`${env}\`, make sure to deploy the project using \`nuxthub deploy\`.`)
      process.exit(1)
    }
    // Update hub.env in runtimeConfig
    hub.env = env
  }

  // Make sure we have a projectUrl when using the remote option
  if (!hub.projectUrl) {
    log.error('No project URL defined, make sure to link your project with `nuxthub link` or add the deployed URL as `NUXT_HUB_PROJECT_URL` environment variable (if self-hosted).')
    process.exit(1)
  }

  // Make sure we have a secret when using the remote option
  if (!hub.projectKey && !hub.projectSecretKey && !hub.userToken) {
    log.error('No project secret key found, make sure to add the `NUXT_HUB_PROJECT_SECRET_KEY` environment variable.')
    process.exit(1)
  }

  // If using the remote option with a projectUrl and a projectSecretKey
  log.info(`Using remote storage from \`${hub.projectUrl}\``)
  const remoteManifest = hub.remoteManifest = await $fetch<HubConfig['remoteManifest']>('/api/_hub/manifest', {
    baseURL: hub.projectUrl as string,
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

  if (remoteManifest?.version !== hub.version) {
    log.warn(`\`${hub.projectUrl}\` is running \`@nuxthub/core@${remoteManifest?.version}\` while the local project is running \`@nuxthub/core@${hub.version}\`. Make sure to use the same version on both sides for a smooth experience.`)
  }

  Object.keys(remoteManifest?.storage || {}).filter(k => hub[k as keyof typeof hub] && !remoteManifest?.storage[k]).forEach((k) => {
    if (!remoteManifest?.storage[k]) {
      log.warn(`Remote storage \`${k}\` is enabled locally but it's not enabled in the remote project. Deploy a new version with \`${k}\` enabled to use it remotely.`)
    }
  })

  const availableStorages = Object.keys(remoteManifest?.storage || {}).filter(k => hub[k as keyof typeof hub] && remoteManifest?.storage[k])
  if (availableStorages.length > 0) {
    logger.info(`Remote storage available: ${availableStorages.map(k => `\`${k}\``).join(', ')} `)
  } else {
    log.fatal('No remote storage available: make sure to enable at least one of the storage options in your `nuxt.config.ts` and deploy new version before using remote storage. Read more at https://hub.nuxt.com/docs/getting-started/remote-storage')
    process.exit(1)
  }
}
