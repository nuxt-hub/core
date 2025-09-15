import { logger, resolvePath } from '@nuxt/kit'
import { defu } from 'defu'
import { isWindows } from 'std-env'

import type { Nitro, NitroOptions } from 'nitropack'
import type { HubConfig } from '../features'
import { pathToFileURL } from 'node:url'

const log = logger.withTag('nuxt:hub')

export async function configureProductionCacheDriver(nitro: Nitro, _hub: HubConfig) {
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
      let driver = await resolvePath('./runtime/cache/cloudflare-driver')
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
    log.info(`Using zero-config \`${cacheConfig.driver}\` cache driver`)
  }
}
