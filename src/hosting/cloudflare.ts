import { writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'pathe'
import { defu } from 'defu'
import { createHooks } from 'hookable'
import { logger } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import type { EnvironmentNonInheritable } from 'nitropack/presets/cloudflare/wrangler/environment'
import type { WranglerConfig } from 'nitropack/presets/cloudflare/types'
import type { HubConfig } from '../types'

const log = logger.withTag('nuxt:hub')

export interface CloudflareHooks {
  /**
   * Mutate the generated wrangler.json configuration before it's written.
   * Called during Cloudflare builds after Nitro generates the initial wrangler.json.
   */
  'wrangler:config': (config: WranglerConfig) => void | Promise<void>
}

export const cloudflareHooks = createHooks<CloudflareHooks>()

export function setupCloudflare(nuxt: Nuxt, hub: HubConfig) {
  // Enable Cloudflare Node.js compatibility
  nuxt.options.nitro.cloudflare ||= {}
  nuxt.options.nitro.cloudflare.nodeCompat = false
  nuxt.options.nitro.cloudflare.deployConfig = true
  // Remove trailing slash for prerender routes
  nuxt.options.nitro.prerender ||= {}
  nuxt.options.nitro.prerender.autoSubfolderIndex ||= false
  // Add no_bundle mode
  if (!hub.hosting.includes('pages')) {
    nuxt.options.nitro.cloudflare.wrangler = defu(nuxt.options.nitro.cloudflare.wrangler, {
      compatibility_flags: ['nodejs_compat']
    })
  }

  // Setup wrangler.json processing (environment flattening + feature hooks)
  if (nuxt.options.dev || nuxt.options._prepare) {
    return
  }

  nuxt.hook('close', async (nuxt) => {
    const cloudflareEnv = process.env.CLOUDFLARE_ENV
    await processWranglerConfigFile(nuxt, cloudflareEnv)
  })
}

/**
 * Non-inheritable keys in Wrangler configuration that must be specified per environment.
 * These keys cannot be inherited from the top-level configuration and must be explicitly
 * defined for each environment when using wrangler environments.
 *
 * @see https://developers.cloudflare.com/workers/wrangler/configuration/#non-inheritable-keys
 */
const NON_INHERITABLE_KEYS: (keyof EnvironmentNonInheritable)[] = [
  'define',
  'vars',
  'durable_objects',
  'workflows',
  'cloudchamber',
  'containers',
  'kv_namespaces',
  'send_email',
  'queues',
  'r2_buckets',
  'd1_databases',
  'vectorize',
  'hyperdrive',
  'services',
  'analytics_engine_datasets',
  'browser',
  'ai',
  'images',
  'version_metadata',
  'unsafe',
  'mtls_certificates',
  'tail_consumers',
  'dispatch_namespaces',
  'pipelines',
  'secrets_store_secrets'
]

/**
 * Wrangler config with optional env section for environment-specific overrides.
 * Extends Nitro's WranglerConfig with the env property.
 */
export type WranglerConfigWithEnv = WranglerConfig & {
  env?: Record<string, WranglerConfig>
}

/**
 * Process the generated wrangler.json file to use a specified CLOUDFLARE_ENV.
 *
 * When CLOUDFLARE_ENV is set to a non-production environment, this function:
 * 1. Removes non-inheritable keys from the top-level configuration
 * 2. Merges the specified environment's configuration into the top-level
 * 3. Removes the env section from the final output
 *
 * This is needed because Wrangler expects generated configurations (from tools like Nitro)
 * to NOT contain the `env` section - the tool should resolve the environment beforehand.
 *
 * @see https://developers.cloudflare.com/workers/wrangler/configuration/#generated-wrangler-configuration
 */
export function processWranglerConfigEnv(config: WranglerConfigWithEnv, targetEnv: string): WranglerConfig {
  // If no env section exists, nothing to process
  if (!config.env || Object.keys(config.env).length === 0) {
    const { env: _, ...rest } = config
    return rest
  }

  // Get the target environment configuration
  const envConfig = config.env[targetEnv]

  if (!envConfig) {
    // Environment not found, just remove the env section and return
    // This handles the "production" case where we deploy to the top-level config
    const { env: _, ...rest } = config
    return rest
  }

  // Create a copy without the env section
  const { env: _, ...baseConfig } = config

  // Remove non-inheritable keys from the top-level (they'll be replaced by env-specific ones)
  const nonInheritableSet = new Set<string>(NON_INHERITABLE_KEYS)
  const filteredConfig = Object.fromEntries(
    Object.entries(baseConfig).filter(([key]) => !nonInheritableSet.has(key))
  )

  // Merge the environment-specific configuration into the top-level
  return { ...filteredConfig, ...envConfig } as WranglerConfig
}

async function processWranglerConfigFile(nuxt: Nuxt, targetEnv?: string) {
  // Nitro outputs wrangler.json to .output/server/
  const wranglerPath = join(nuxt.options.rootDir, '.output', 'server', 'wrangler.json')

  if (!existsSync(wranglerPath)) {
    log.warn(`No wrangler.json found at ${wranglerPath}, skipping wrangler processing`)
    return
  }

  try {
    const content = await readFile(wranglerPath, 'utf-8')
    let config: WranglerConfigWithEnv = JSON.parse(content)

    if (targetEnv && config.env?.[targetEnv]) {
      // Flatten the specified environment into top-level config
      config = processWranglerConfigEnv(config, targetEnv)
      log.info(`Using wrangler environment \`${targetEnv}\``)
    } else {
      // Remove env section if present (use top-level config)
      if (config.env) {
        const { env: _, ...rest } = config
        config = rest
      }
      if (targetEnv) {
        log.info(`No environment \`${targetEnv}\` found in wrangler config, using top-level configuration`)
      }
    }

    // Allow modules to mutate the wrangler config
    await cloudflareHooks.callHook('wrangler:config', config)

    // Write the processed config back
    await writeFile(wranglerPath, JSON.stringify(config, null, 2), 'utf-8')
  } catch (error) {
    log.error(`Failed to process wrangler config: ${error}`)
  }
}
