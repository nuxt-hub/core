import type { Nuxt } from '@nuxt/schema'
import { stringifyTOML } from 'confbox'
import type { HubConfig } from '../features'

// IMPORTANT:
// Please update nuxt-hub/cli preview command as well
export function generateWrangler(nuxt: Nuxt, hub: HubConfig) {
  const wrangler: { [key: string]: any } = {}
  const name = hub.env === 'test' ? 'test' : 'default'

  if (hub.analytics && !hub.remote) {
    wrangler['analytics_engine_datasets'] = [{
      binding: 'ANALYTICS',
      dataset: name
    }]
  }

  if (hub.blob && !hub.remote) {
    wrangler['r2_buckets'] = [{
      binding: 'BLOB',
      bucket_name: name
    }]
  }

  if (hub.kv || hub.cache) {
    wrangler['kv_namespaces'] = []

    if (hub.kv && !hub.remote) {
      wrangler['kv_namespaces'].push({
        binding: 'KV',
        id: `kv_${name}`
      })
    }

    if (hub.cache) {
      wrangler['kv_namespaces'].push({
        binding: 'CACHE',
        id: `cache_${name}`
      })
    }
  }

  if (hub.database && !hub.remote) {
    wrangler['d1_databases'] = [{
      binding: 'DB',
      database_name: name,
      database_id: name
    }]
  }

  // Disabled until getPlatformProxy() returns the hyperdrive binding
  // if (hub.bindings?.hyperdrive) {
  //   wrangler['hyperdrive'] = Object.entries(hub.bindings.hyperdrive).map(([key, value]) => {
  //     const envKey = `NUXT_HUB_HYPERDRIVE_${key.toUpperCase()}_URL`
  //     const localConnectionString = process.env[envKey]
  //     if (nuxt.options.dev && !localConnectionString) {
  //       console.error(`Missing \`${envKey}\` environment variable for Hyperdrive binding \`${key}\` (ID: ${value}).`)
  //       process.exit(1)
  //     }
  //     return {
  //       binding: key,
  //       id: value,
  //       localConnectionString
  //     }
  //   })
  // }

  return stringifyTOML(wrangler)
}
