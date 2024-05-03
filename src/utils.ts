import { addCustomTab } from '@nuxt/devtools-kit'
import type { Nuxt } from 'nuxt/schema'
import { stringifyTOML } from 'confbox'

export function generateWrangler(hub: { kv: boolean, database: boolean, blob: boolean, cache: boolean, analytics: boolean }) {
  const wranger: { [key: string]: any } = {}

  if (hub.analytics) {
    wranger['analytics_engine_datasets'] = [{
      binding: 'ANALYTICS',
      dataset: 'default'
    }]
  }

  if (hub.blob) {
    wranger['r2_buckets'] = [{
      binding: 'BLOB',
      bucket_name: 'default'
    }]
  }

  if (hub.cache || hub.kv) {
    wranger['kv_namespaces'] = []
    if (hub.kv) {
      wranger['kv_namespaces'].push({
        binding: 'KV',
        id: 'kv_default'
      })
    }
    if (hub.cache) {
      wranger['kv_namespaces'].push({
        binding: 'CACHE',
        id: 'cache_default'
      })
    }
  }

  if (hub.database) {
    wranger['d1_databases'] = [{
      binding: 'DB',
      database_name: 'default',
      database_id: 'default'
    }]
  }

  return stringifyTOML(wranger)
}

export function addDevtoolsCustomTabs(nuxt: Nuxt, hub: { kv: boolean, database: boolean, blob: boolean, cache: boolean, analytics: boolean }) {
  nuxt.hook('listen', (_, { url }) => {
    hub.database && addCustomTab({
      category: 'server',
      name: 'hub-database',
      title: 'Hub Database',
      icon: 'i-ph-database',
      view: {
        type: 'iframe',
        src: `https://admin.hub.nuxt.com/embed/database?url=${url}`
      }
    })

    hub.kv && addCustomTab({
      category: 'server',
      name: 'hub-kv',
      title: 'Hub KV',
      icon: 'i-ph-coin',
      view: {
        type: 'iframe',
        src: `https://admin.hub.nuxt.com/embed/kv?url=${url}`
      }
    })

    hub.blob && addCustomTab({
      category: 'server',
      name: 'hub-blob',
      title: 'Hub Blob',
      icon: 'i-ph-shapes',
      view: {
        type: 'iframe',
        src: `https://admin.hub.nuxt.com/embed/blob?url=${url}`
      }
    })

    hub.cache && addCustomTab({
      category: 'server',
      name: 'hub-cache',
      title: 'Hub Cache',
      icon: 'i-ph-lightning',
      view: {
        type: 'iframe',
        src: `https://admin.hub.nuxt.com/embed/cache?url=${url}`
      }
    })
  })
}
