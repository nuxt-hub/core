import type { Nuxt } from '@nuxt/schema'
import { stringifyTOML } from 'confbox'
import type { HubConfig } from '../features'

// IMPORTANT:
// Please update nuxt-hub/cli preview command as well
export function generateWrangler(nuxt: Nuxt, hub: HubConfig) {
  const wrangler: { [key: string]: any } = {}

  if (hub.ai) {
    wrangler['ai'] = {
      binding: 'AI'
    }
  }

  if (hub.analytics) {
    wrangler['analytics_engine_datasets'] = [{
      binding: 'ANALYTICS',
      dataset: 'default'
    }]
  }

  if (hub.blob) {
    wrangler['r2_buckets'] = [{
      binding: 'BLOB',
      bucket_name: 'default'
    }]
  }

  if (hub.kv) {
    wrangler['kv_namespaces'] = [{
      binding: 'KV',
      id: 'kv_default'
    }]
  }

  if (hub.database) {
    wrangler['d1_databases'] = [{
      binding: 'DB',
      database_name: 'default',
      database_id: 'default'
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
