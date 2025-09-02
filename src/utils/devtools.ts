import { addCustomTab } from '@nuxt/devtools-kit'
import type { Nuxt } from 'nuxt/schema'
import type { HubConfig } from '../features'

export function addDevToolsCustomTabs(nuxt: Nuxt, _hub: HubConfig) {
  nuxt.hook('listen', (_) => {
    nuxt.options.nitro.experimental?.openAPI && addCustomTab({
      category: 'server',
      name: 'hub-open-api',
      title: 'OpenAPI',
      icon: 'i-lucide-file-text',
      view: {
        type: 'iframe',
        src: `/_scalar`
      }
    })
  })
}
