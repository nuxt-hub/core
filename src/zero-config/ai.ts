import { logger } from '@nuxt/kit'
import { ensureDependencyInstalled } from 'nypm'

import type { Nitro } from 'nitropack'
import type { HubConfig } from '../features'

const log = logger.withTag('nuxt:hub')

export async function configureProductionAIDriver(nitro: Nitro, hub: HubConfig) {
  const preset = nitro.options.preset
  if (!preset) return

  if (hub.ai === 'vercel') {
    await ensureDependencyInstalled('@ai-sdk/gateway')
  }
  if (hub.ai === 'cloudflare') {
    await ensureDependencyInstalled('workers-ai-provider')
  }

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
    log.info(`Using zero-config \`${hub.ai}\` AI provider`)
  }
}
