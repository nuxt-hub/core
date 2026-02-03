import { writeFile } from 'node:fs/promises'
import { join } from 'pathe'
import { defu } from 'defu'
import { addTypeTemplate, addServerImports } from '@nuxt/kit'
import { logWhenReady } from '../utils'
import { cloudflareHooks } from '../hosting/cloudflare'

import type { Nuxt } from '@nuxt/schema'
import type { HubConfig, ResolvedSandboxConfig, SandboxConfig } from '@nuxthub/core'

/**
 * Resolve sandbox configuration from boolean or object format
 */
export function resolveSandboxConfig(hub: HubConfig): ResolvedSandboxConfig | false {
  if (!hub.sandbox) return false

  const userConfig = typeof hub.sandbox === 'object' ? hub.sandbox : {} as SandboxConfig

  // If provider is already specified by user, use it
  if (userConfig.provider) {
    return userConfig as ResolvedSandboxConfig
  }

  // Auto-detect provider from hosting
  if (hub.hosting.includes('cloudflare')) {
    return defu(userConfig, { provider: 'cloudflare' }) as ResolvedSandboxConfig
  }

  if (hub.hosting.includes('vercel')) {
    return defu(userConfig, { provider: 'vercel', runtime: 'node24' }) as ResolvedSandboxConfig
  }

  // Dev mode: check for Vercel tokens
  if (process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL_TOKEN) {
    return defu(userConfig, { provider: 'vercel', runtime: 'node24' }) as ResolvedSandboxConfig
  }

  // Default to vercel
  return defu(userConfig, { provider: 'vercel', runtime: 'node24' }) as ResolvedSandboxConfig
}

function generateSandboxCode(config: ResolvedSandboxConfig): string {
  const cloudflareImport = config.provider === 'cloudflare' ? 'import { getSandbox } from \'@cloudflare/sandbox\'\\n' : ''
  const cloudflareGetSandbox = config.provider === 'cloudflare' ? 'getSandbox' : 'undefined'
  return `import { createSandbox, detectSandbox, isSandboxAvailable } from 'unagent/sandbox'
${cloudflareImport}import { useEvent } from 'nitropack/runtime'
export { detectSandbox, isSandboxAvailable }

const config = ${JSON.stringify(config)}
const defaultGetSandbox = ${cloudflareGetSandbox}

function parseBoolean(value) {
  if (!value) return undefined
  if (value === 'true' || value === '1') return true
  if (value === 'false' || value === '0') return false
  return undefined
}

function parseNumber(value) {
  if (!value) return undefined
  const num = Number(value)
  return Number.isFinite(num) ? num : undefined
}

function parsePorts(value) {
  if (!value) return undefined
  const ports = value.split(',').map(p => Number(p.trim())).filter(p => Number.isFinite(p))
  return ports.length ? ports : undefined
}

function parseEnvConfig() {
  const env = typeof process !== 'undefined' ? process.env : {}
  const providerRaw = env.NUXT_HUB_SANDBOX_PROVIDER?.toLowerCase()
  const provider = providerRaw === 'vercel' || providerRaw === 'cloudflare' ? providerRaw : undefined
  const runtime = env.NUXT_HUB_SANDBOX_RUNTIME
  const timeout = parseNumber(env.NUXT_HUB_SANDBOX_TIMEOUT)
  const cpu = parseNumber(env.NUXT_HUB_SANDBOX_CPU)
  const ports = parsePorts(env.NUXT_HUB_SANDBOX_PORTS)
  const sandboxId = env.NUXT_HUB_SANDBOX_ID

  const sleepAfter = env.NUXT_HUB_SANDBOX_CF_SLEEP_AFTER
  const keepAlive = parseBoolean(env.NUXT_HUB_SANDBOX_CF_KEEP_ALIVE)
  const normalizeId = parseBoolean(env.NUXT_HUB_SANDBOX_CF_NORMALIZE_ID)
  const cloudflare = sleepAfter || keepAlive !== undefined || normalizeId !== undefined
    ? {
        sleepAfter: sleepAfter ? (Number.isFinite(Number(sleepAfter)) ? Number(sleepAfter) : sleepAfter) : undefined,
        keepAlive,
        normalizeId,
      }
    : undefined

  return { provider, runtime, timeout, cpu, ports, sandboxId, cloudflare }
}

function resolveOptions(options) {
  const envConfig = parseEnvConfig()
  return { ...config, ...envConfig, ...options }
}

export async function hubSandbox(options = {}) {
  const opts = resolveOptions(options)
  const provider = opts.provider || config.provider

  if (provider === 'cloudflare') {
    const namespace = opts.namespace ?? useEvent().context.cloudflare?.env?.SANDBOX
    if (!namespace) {
      throw new Error('Cloudflare sandbox requires SANDBOX binding. Ensure hub.sandbox is enabled and you are running on Cloudflare.')
    }
    return createSandbox({
      provider: {
        name: 'cloudflare',
        namespace,
        sandboxId: opts.sandboxId,
        cloudflare: opts.cloudflare,
        getSandbox: opts.getSandbox ?? defaultGetSandbox,
      },
    })
  }

  return createSandbox({
    provider: {
      name: 'vercel',
      runtime: opts.runtime,
      timeout: opts.timeout,
      cpu: opts.cpu,
      ports: opts.ports,
    },
  })
}
`
}

export async function setupSandbox(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>) {
  hub.sandbox = resolveSandboxConfig(hub)
  if (!hub.sandbox) return

  const sandboxConfig = hub.sandbox as ResolvedSandboxConfig

  // Verify provider SDK dependencies
  if (sandboxConfig.provider === 'vercel' && !deps['@vercel/sandbox']) {
    logWhenReady(nuxt, 'Please run `npx nypm i @vercel/sandbox` to use Vercel Sandbox', 'error')
    return
  }
  if (sandboxConfig.provider === 'cloudflare' && !deps['@cloudflare/sandbox']) {
    logWhenReady(nuxt, 'Please run `npx nypm i @cloudflare/sandbox` to use Cloudflare Sandbox', 'error')
    return
  }

  // Configure Cloudflare Durable Objects binding for sandbox
  if (sandboxConfig.provider === 'cloudflare' && !nuxt.options.dev) {
    // Use nitro:init hook - runs after preset is applied
    nuxt.hook('nitro:init', (nitro) => {
      const cfExternals = ['cloudflare:workers', 'cloudflare:sockets']

      // Add cloudflare-specific externals
      const existing = nitro.options.rollupConfig?.external
      if (Array.isArray(existing)) {
        existing.push(...cfExternals)
      } else if (typeof existing === 'string') {
        nitro.options.rollupConfig!.external = [existing, ...cfExternals]
      } else {
        nitro.options.rollupConfig = nitro.options.rollupConfig || {}
        nitro.options.rollupConfig.external = cfExternals
      }

      // Add Sandbox export banner
      nitro.options.rollupConfig = nitro.options.rollupConfig || {}
      nitro.options.rollupConfig.output = nitro.options.rollupConfig.output || {}
      ;(nitro.options.rollupConfig.output as Record<string, unknown>).banner = `export { Sandbox } from '@cloudflare/sandbox';`
    })

    // Get sandbox version for Docker image tag
    const sandboxVersion = deps['@cloudflare/sandbox']?.replace(/^\^|~/, '') || '0.7.0'

    // Add durable_objects binding, containers, and migration to wrangler config
    cloudflareHooks.hook('wrangler:config', (config) => {
      config.durable_objects = defu(config.durable_objects, {
        bindings: [{ name: 'SANDBOX', class_name: 'Sandbox' }]
      })
      // Add containers config - use Dockerfile that extends pre-built image
      config.containers = config.containers || []
      if (!config.containers.some((c: { class_name?: string }) => c.class_name === 'Sandbox')) {
        config.containers.push({
          class_name: 'Sandbox',
          image: './Dockerfile.sandbox',
          max_instances: 10
        })
      }
      // Add migrations for containers - needs SQLite-backed DO
      config.migrations = config.migrations || []
      const hasSandboxMigration = config.migrations.some((m: { new_sqlite_classes?: string[] }) => m.new_sqlite_classes?.includes('Sandbox'))
      if (!hasSandboxMigration) {
        config.migrations.push({ tag: 'v2', new_sqlite_classes: ['Sandbox'] })
      }
    })

    // Write Dockerfile.sandbox to output directory
    cloudflareHooks.hook('wrangler:files', async (outputDir) => {
      const dockerfile = `FROM docker.io/cloudflare/sandbox:${sandboxVersion}\n`
      await writeFile(join(outputDir, 'Dockerfile.sandbox'), dockerfile)
    })
  }

  // Generate sandbox runtime code using unagent
  const sandboxContent = generateSandboxCode(sandboxConfig)

  // Create virtual module for the sandbox
  nuxt.hook('nitro:config', (nitroConfig) => {
    nitroConfig.virtual = nitroConfig.virtual || {}
    nitroConfig.virtual['#hub/sandbox'] = sandboxContent
  })

  addServerImports([
    { name: 'hubSandbox', from: '#hub/sandbox', meta: { description: 'Create a sandbox instance for running isolated code.' } },
    { name: 'isSandboxAvailable', from: '#hub/sandbox', meta: { description: 'Check if a sandbox provider SDK is available.' } },
    { name: 'detectSandbox', from: '#hub/sandbox', meta: { description: 'Detect current sandbox environment.' } }
  ])

  addTypeTemplate({
    filename: 'hub/sandbox.d.ts',
    getContents: () => `declare module '#hub/sandbox' {
  export { hubSandbox, isSandboxAvailable, detectSandbox } from '@nuxthub/core'
}
declare module 'hub:sandbox' {
  export { hubSandbox, isSandboxAvailable, detectSandbox } from '@nuxthub/core'
}`
  }, { nitro: true, nuxt: true })

  // Add alias for hub:sandbox
  nuxt.options.alias['hub:sandbox'] = '#hub/sandbox'

  logWhenReady(nuxt, `\`hub:sandbox\` using \`${sandboxConfig.provider}\` provider`)
}
