import { addCustomTab } from '@nuxt/devtools-kit'
import type { Nuxt } from 'nuxt/schema'
import type { HubConfig } from '../setup'

export function addDevtoolsCustomTabs(nuxt: Nuxt, hub: HubConfig) {
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
