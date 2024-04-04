import { addCustomTab } from '@nuxt/devtools-kit'
import type { Nuxt } from 'nuxt/schema'

export function generateWrangler() {
  return `d1_databases = [
  { binding = "DB", database_name = "default", database_id = "default" },
]
kv_namespaces = [
  { binding = "KV", id = "kv_default" },
  { binding = "CACHE", id = "cache_default" },
]
r2_buckets = [
  { binding = "BLOB", bucket_name = "default" },
]
analytics_engine_datasets = [
  { binding = "ANALYTICS", dataset = "default" }
]
`
}


export function addDevtoolsCustomTabs(nuxt: Nuxt, hub: { kv: boolean, database: boolean, blob: boolean }) {
  nuxt.hook('listen', (_, { url }) => {
    hub.database && addCustomTab({
      category: 'server',
      name: 'hub-database',
      title: 'Hub Database',
      icon: 'i-ph-database',
      view: {
        type: 'iframe',
        src: `https://admin.hub.nuxt.com/embed/database?url=${url}`,
      },
    })

    hub.kv && addCustomTab({
      category: 'server',
      name: 'hub-kv',
      title: 'Hub KV',
      icon: 'i-ph-coin',
      view: {
        type: 'iframe',
        src: `https://admin.hub.nuxt.com/embed/kv?url=${url}`,
      },
    })

    hub.blob && addCustomTab({
      category: 'server',
      name: 'hub-blob',
      title: 'Hub Blob',
      icon: 'i-ph-shapes',
      view: {
        type: 'iframe',
        src: `https://admin.hub.nuxt.com/embed/blob?url=${url}`,
      },
    })
  })
}