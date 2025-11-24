import { addCustomTab } from '@nuxt/devtools-kit'
import type { Nuxt } from 'nuxt/schema'
import type { HubConfig } from '../features'

export function addDevToolsCustomTabs(nuxt: Nuxt, hub: HubConfig) {
  nuxt.hook('listen', (_, { url }) => {
    hub.database && addCustomTab({
      category: 'server',
      name: 'hub-database',
      title: 'Hub Database',
      icon: 'i-lucide-database',
      view: {
        type: 'iframe',
        src: `https://admin.hub.nuxt.com/embed/database?url=${url}`,
        permissions: ['local-network-access https://admin.hub.nuxt.com']
      }
    })

    hub.kv && addCustomTab({
      category: 'server',
      name: 'hub-kv',
      title: 'Hub KV',
      icon: 'i-lucide-list',
      view: {
        type: 'iframe',
        src: `https://admin.hub.nuxt.com/embed/kv?url=${url}`,
        permissions: ['local-network-access https://admin.hub.nuxt.com']
      }
    })

    hub.blob && addCustomTab({
      category: 'server',
      name: 'hub-blob',
      title: 'Hub Blob',
      icon: 'i-lucide-shapes',
      view: {
        type: 'iframe',
        src: `https://admin.hub.nuxt.com/embed/blob?url=${url}`,
        permissions: ['local-network-access https://admin.hub.nuxt.com']
      }
    })

    hub.cache && addCustomTab({
      category: 'server',
      name: 'hub-cache',
      title: 'Hub Cache',
      icon: 'i-lucide-database-zap',
      view: {
        type: 'iframe',
        src: `https://admin.hub.nuxt.com/embed/cache?url=${url}`,
        permissions: ['local-network-access https://admin.hub.nuxt.com']
      }
    })

    hub.openAPIRoute && addCustomTab({
      category: 'server',
      name: 'hub-open-api',
      title: 'OpenAPI',
      icon: 'i-lucide-file-text',
      view: {
        type: 'iframe',
        src: `/api/_hub/scalar`
      }
    })
  })
}
