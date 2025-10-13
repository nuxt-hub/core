import { join } from 'pathe'
import { defu } from 'defu'
import { ensureDependencyInstalled } from 'nypm'
import { createResolver, addServerScanDir, addServerImportsDir, logger } from '@nuxt/kit'
import { logWhenReady } from '../features'

import type { Nuxt } from '@nuxt/schema'
import type { Nitro, NitroOptions } from 'nitropack'
import type { HubConfig } from '../features'

const log = logger.withTag('nuxt:hub')
const { resolve } = createResolver(import.meta.url)

export function setupKV(nuxt: Nuxt, hub: HubConfig) {
  // Configure dev storage
  nuxt.options.nitro.devStorage ||= {}
  nuxt.options.nitro.devStorage.kv = defu(nuxt.options.nitro.devStorage.kv, {
    driver: 'fs',
    base: join(hub.dir!, 'kv')
  })

  // Add Server scanning
  addServerScanDir(resolve('../runtime/kv/server'))
  addServerImportsDir(resolve('../runtime/kv/server/utils'))

  const driver = nuxt.options.dev ? nuxt.options.nitro.devStorage.kv.driver : nuxt.options.nitro.storage?.kv?.driver

  logWhenReady(nuxt, `\`hubKV()\` configured with \`${driver}\` driver`)
}

export async function setupProductionKV(nitro: Nitro, _hub: HubConfig) {
  const preset = nitro.options.preset
  if (!preset) return

  // Only configure if KV driver is not already set
  if (nitro.options.storage?.kv?.driver) {
    log.info(`\`hubKV()\` configured with \`${nitro.options.storage.kv.driver}\` driver (defined in \`nuxt.config.ts\`)`)
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
        driver: 'cloudflare-kv-binding',
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
    log.info(`\`hubKV()\` configured with \`${kvConfig.driver}\` driver`)
  }
}
