import { pathToFileURL } from 'node:url'
import { join } from 'pathe'
import { defu } from 'defu'
import { isWindows } from 'std-env'
import { addServerScanDir, logger } from '@nuxt/kit'
import { logWhenReady } from '../features'
import { resolve, resolvePath } from '../module'

import type { Nuxt } from '@nuxt/schema'
import type { Nitro, NitroOptions } from 'nitropack'
import type { HubConfig } from '../features'

const log = logger.withTag('nuxt:hub')

export async function setupCache(nuxt: Nuxt, hub: HubConfig, _deps: Record<string, string>) {
  // Configure dev storage
  nuxt.options.nitro.devStorage ||= {}

  let devCacheConfig: NitroOptions['storage']['default']

  // Cloudflare Dev
  if (nuxt.options.nitro.preset === 'cloudflare-dev') {
    devCacheConfig = {
      driver: 'cloudflare-kv-binding',
      bindingName: 'CACHE'
    }

  // All other presets
  } else {
    devCacheConfig = {
      driver: 'fs-lite',
      base: join(hub.dir!, 'cache')
    }
  }

  nuxt.options.nitro.devStorage.cache = defu(nuxt.options.nitro.devStorage.cache, devCacheConfig)

  // Add Server scanning
  addServerScanDir(resolve('runtime/cache/server'))

  logWhenReady(nuxt, `\`Hub cache\` configured with \`${nuxt.options.nitro.devStorage.cache.driver}\` driver`)
}

export async function setupProductionCache(nitro: Nitro, _hub: HubConfig, _deps: Record<string, string>) {
  const preset = nitro.options.preset
  if (!preset) return

  // Only configure if cache driver is not already set
  if (nitro.options.storage?.cache?.driver) {
    log.info(`Using user-configured \`${nitro.options.storage.cache.driver}\` cache driver`)
    return
  }

  let cacheConfig: NitroOptions['storage']['cache']

  switch (preset) {
    // Does your favourite cloud provider require special configuration? Feel free to open a PR to add zero-config support for other presets

    case 'vercel': {
      cacheConfig = {
        driver: 'vercel-runtime-cache'
      }
      break
    }

    case 'cloudflare-module':
    case 'cloudflare-durable':
    case 'cloudflare-pages': {
      // TODO: cloudflare cache binding https://github.com/unjs/unstorage/pull/603
      let driver = await resolvePath('runtime/cache/cloudflare-driver')
      if (isWindows) {
        driver = pathToFileURL(driver).href
      }
      cacheConfig = {
        driver,
        binding: 'CACHE'
      }
      log.info('Ensure a `CACHE` binding is set in your Cloudflare Workers configuration')
      break
    }

    default:
      cacheConfig = {
        driver: 'memory'
      }
      break
  }

  if (cacheConfig) {
    nitro.options.storage ||= {}
    nitro.options.storage.cache = defu(nitro.options.storage?.cache, cacheConfig)
    log.info(`\`Hub cache\` configured with \`${nitro.options.storage.cache.driver}\` driver`)
  }
}
