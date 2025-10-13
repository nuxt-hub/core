import { addServerImportsDir, addServerScanDir, addTypeTemplate, logger } from '@nuxt/kit'
import { ensureDependencyInstalled } from 'nypm'
import { logWhenReady } from '../features'
import { resolve } from '../module'

import type { Nuxt } from '@nuxt/schema'
import type { Nitro } from 'nitropack'
import type { HubConfig } from '../features'

const log = logger.withTag('nuxt:hub')

export async function setupAI(nuxt: Nuxt, hub: HubConfig) {
  const providerName = hub.ai === 'vercel' ? 'Vercel AI Gateway' : 'Workers AI Provider'

  if (hub.ai === 'vercel') {
    await Promise.all([
      ensureDependencyInstalled('@ai-sdk/gateway')
    ])
  } else if (hub.ai === 'cloudflare') {
    await Promise.all([
      ensureDependencyInstalled('workers-ai-provider')
    ])
  } else {
    return logWhenReady(nuxt, `\`${hub.ai}\` is not a supported AI provider. Set \`hub.ai\` to \`'vercel'\` or \`'cloudflare'\` in your \`nuxt.config.ts\`. Learn more at https://hub.nuxt.com/docs/features/ai.`, 'error')
  }

  // Used for typing hubAI() with the correct provider
  addTypeTemplate({
    filename: 'types/nuxthub-ai.d.ts',
    getContents: () => `export type NuxtHubAIProvider = ${JSON.stringify(hub.ai)}
    `
  })

  if (hub.ai === 'cloudflare') {
    const isCloudflareRuntime = nuxt.options.nitro.preset?.includes('cloudflare')
    const isAiBindingSet = !!(process.env.AI as { runtime: string } | undefined)?.runtime

    if (isCloudflareRuntime && !isAiBindingSet) {
      return logWhenReady(nuxt, 'Ensure a `AI` binding is set in your Cloudflare Workers configuration', 'error')
    }

    if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_KEY) {
      return logWhenReady(nuxt, `Set \`CLOUDFLARE_ACCOUNT_ID\` and \`CLOUDFLARE_API_KEY\` environment variables to enable \`hubAI()\` with ${providerName}`, 'error')
    }
  } else if (hub.ai === 'vercel') {
    const isMissingEnvVars = !process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN
    if (isMissingEnvVars && nuxt.options.dev) {
      return logWhenReady(nuxt, `Missing \`AI_GATEWAY_API_KEY\` environment variable to enable \`hubAI()\` with ${providerName}\nCreate an AI Gateway API key at \`${encodeURI('https://vercel.com/d?to=/[team]/~/ai/api-keys&title=Go+to+AI+Gateway')}\` or run \`npx vercel env pull .env\` to pull the environment variables.`, 'error')
    } else if (isMissingEnvVars) {
      return logWhenReady(nuxt, `Set \`AI_GATEWAY_API_KEY\` environment variable to enable \`hubAI()\` with ${providerName}\nCreate an AI Gateway API key at \`${encodeURI('https://vercel.com/d?to=/[team]/~/ai/api-keys&title=Go+to+AI+Gateway')}\``, 'error')
    }
  }

  // Add Server scanning
  addServerScanDir(resolve('runtime/ai/server'))
  addServerImportsDir(resolve('runtime/ai/server/utils'))

  logWhenReady(nuxt, `\`hubAI()\` configured with \`${providerName}\``)
}

export async function setupProductionAI(nitro: Nitro, hub: HubConfig) {
  const preset = nitro.options.preset
  if (!preset) return

  switch (preset) {
    // Does your favourite cloud provider require special configuration? Feel free to open a PR to add zero-config support for other presets

    case 'vercel': {
      if (hub.ai === 'vercel') {
        // OIDC automatically configured - https://vercel.com/docs/oidc#in-vercel-functions
      }

      if (hub.ai === 'cloudflare') {
        if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
          log.warn('Set `CLOUDFLARE_ACCOUNT_ID` environment variable to configure Cloudflare AI')
        }
        if (!process.env.CLOUDFLARE_API_KEY) {
          log.warn('Set `CLOUDFLARE_API_KEY` environment variable to configure Cloudflare AI')
        }
      }
      break
    }

    case 'cloudflare-module':
    case 'cloudflare-durable':
    case 'cloudflare-pages': {
      if (hub.ai === 'cloudflare') {
        if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
          log.warn('Set `CLOUDFLARE_ACCOUNT_ID` environment variable to configure Cloudflare AI')
        }
        if (!process.env.CLOUDFLARE_API_KEY) {
          log.warn('Set `CLOUDFLARE_API_KEY` environment variable to configure Cloudflare AI')
        }
      }

      if (hub.ai === 'vercel') {
        if (!process.env.AI_GATEWAY_API_KEY) {
          log.warn('Set `AI_GATEWAY_API_KEY` environment variable to configure AI Gateway')
        }
      }

      break
    }

    default: {
      if (hub.ai === 'cloudflare') {
        nitro.options.cloudflare?.wrangler?.ai?.binding === 'AI'
        log.info('Ensure a `AI` binding is set in your Cloudflare Workers configuration')
      }

      if (hub.ai === 'vercel') {
        if (!process.env.AI_GATEWAY_API_KEY) {
          log.warn('Set `AI_GATEWAY_API_KEY` environment variable to configure AI Gateway')
        }
      }
      break
    }
  }

  if (hub.ai) {
    const providerName = hub.ai === 'vercel' ? 'Vercel AI Gateway' : 'Workers AI Provider'
    log.info(`\`hubAI()\` configured with \`${providerName}\``)
  }
}
