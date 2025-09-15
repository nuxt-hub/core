import { logger } from '@nuxt/kit'
import { defu } from 'defu'
import { ensureDependencyInstalled } from 'nypm'

import type { Nitro, NitroOptions } from 'nitropack'
import type { HubConfig } from '../features'

const log = logger.withTag('nuxt:hub')

export async function configureProductionKVDriver(nitro: Nitro, _hub: HubConfig) {
  const preset = nitro.options.preset
  if (!preset) return

  // Only configure if KV driver is not already set
  if (nitro.options.storage?.kv?.driver) {
    log.info(`Using user-configured \`${nitro.options.storage.kv.driver}\` KV driver`)
    return
  }

  let kvConfig: NitroOptions['storage']['kv']

  switch (preset) {
    // Does your favourite cloud provider require special configuration? Feel free to open a PR to add zero-config support for other presets

    case 'vercel': {
      kvConfig = {
        driver: 'redis',
        url: process.env.REDIS_URL
      }
      if (!process.env.REDIS_URL) {
        log.warn('Set `REDIS_URL` environment variable to configure Redis KV storage')
      }
      break
    }

    case 'cloudflare-module':
    case 'cloudflare-durable':
    case 'cloudflare-pages': {
      kvConfig = {
        driver: 'cloudflare-kv',
        bindingName: 'KV'
      }
      log.info('Ensure a `KV` binding is set in your Cloudflare Workers configuration')
      break
    }

    case 'deno':
    case 'deno-deploy': {
      kvConfig = {
        driver: 'deno-kv'
      }
      break
    }

    default: {
      kvConfig = {
        driver: 'fs-lite',
        base: '.data/kv'
      }
      break
    }
  }

  if (kvConfig) {
    // check if driver dependencies are installed
    switch (kvConfig.driver) {
      case 'redis':
        await ensureDependencyInstalled('ioredis')
        break
    }

    // set driver
    nitro.options.storage ||= {}
    nitro.options.storage.kv = defu(nitro.options.storage?.kv, kvConfig)
    log.info(`Using zero-config \`${kvConfig.driver}\` KV driver`)
  }
}
