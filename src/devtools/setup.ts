import { addServerHandler, createResolver } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import type { HubConfig } from '@nuxthub/core'
import { joinURL, withQuery } from 'ufo'
import { resolveDevtoolsAppOrigin } from './origin'

function resolveDevtoolsConfig(hub: HubConfig) {
  const cfg = hub.devtools
  const user = typeof cfg === 'object' ? cfg : {}
  return {
    remoteBaseUrl: user.remoteBaseUrl || 'https://hub.nuxt.com',
    remotePathPrefix: user.remotePathPrefix || '/devtools',
    appOrigin: user.appOrigin as string | undefined
  }
}

function getLocalOrigin(nuxt: Nuxt, hub: HubConfig) {
  const { appOrigin } = resolveDevtoolsConfig(hub)
  return resolveDevtoolsAppOrigin({
    appOrigin,
    https: Boolean(nuxt.options.devServer.https),
    devServerPort: nuxt.options.devServer.port,
    argv: process.argv,
    env: process.env,
    defaultPort: 3000
  })
}

export async function setupDevTools(nuxt: Nuxt, hub: HubConfig) {
  if (!nuxt.options.dev) return
  if (nuxt.options.test) return
  if (hub.devtools === false) return
  if (!hub.kv && !hub.blob && !hub.cache) return

  const { resolve } = createResolver(import.meta.url)

  // Register server handlers
  if (hub.kv) {
    addServerHandler({ route: '/_hub/devtools/kv', method: 'get', handler: resolve('../devtools-runtime/server/api/kv/index.get') })
    addServerHandler({ route: '/_hub/devtools/kv/clear', method: 'post', handler: resolve('../devtools-runtime/server/api/kv/clear.post') })
    addServerHandler({ route: '/_hub/devtools/kv/:key', handler: resolve('../devtools-runtime/server/api/kv/[key]') })

    // Hosted DevTools UI compatibility (hub.nuxt.com)
    addServerHandler({ route: '/api/_hub/kv/**:key', handler: resolve('../devtools-runtime/server/api/_hub/kv/[...key]') })
  }
  if (hub.blob) {
    addServerHandler({ route: '/_hub/devtools/blob', method: 'get', handler: resolve('../devtools-runtime/server/api/blob/index.get') })
    addServerHandler({ route: '/_hub/devtools/blob/**:pathname', handler: resolve('../devtools-runtime/server/api/blob/[...pathname]') })

    // Hosted DevTools UI compatibility (hub.nuxt.com)
    addServerHandler({ route: '/api/_hub/blob', method: 'get', handler: resolve('../devtools-runtime/server/api/_hub/blob/index.get') })
    addServerHandler({ route: '/api/_hub/blob', method: 'post', handler: resolve('../devtools-runtime/server/api/_hub/blob/index.post') })
    addServerHandler({ route: '/api/_hub/blob/head/**:pathname', method: 'get', handler: resolve('../devtools-runtime/server/api/_hub/blob/head.get') })
    addServerHandler({ route: '/api/_hub/blob/**:pathname', handler: resolve('../devtools-runtime/server/api/_hub/blob/[...pathname]') })
  }
  if (hub.cache) {
    addServerHandler({ route: '/_hub/devtools/cache', method: 'get', handler: resolve('../devtools-runtime/server/api/cache/index.get') })
    addServerHandler({ route: '/_hub/devtools/cache/clear', method: 'post', handler: resolve('../devtools-runtime/server/api/cache/clear.post') })
    addServerHandler({ route: '/_hub/devtools/cache/:key', handler: resolve('../devtools-runtime/server/api/cache/[key]') })

    // Hosted DevTools UI compatibility (hub.nuxt.com)
    addServerHandler({ route: '/api/_hub/cache', method: 'get', handler: resolve('../devtools-runtime/server/api/_hub/cache/index.get') })
    addServerHandler({ route: '/api/_hub/cache/batch-delete', method: 'post', handler: resolve('../devtools-runtime/server/api/_hub/cache/batch-delete.post') })
    addServerHandler({ route: '/api/_hub/cache/clear/**:base', method: 'delete', handler: resolve('../devtools-runtime/server/api/_hub/cache/clear.delete') })
    addServerHandler({ route: '/api/_hub/cache/**:key', handler: resolve('../devtools-runtime/server/api/_hub/cache/[...key]') })
  }
}

export function addDevToolsStorageTabs(nuxt: Nuxt, hub: HubConfig) {
  if (!nuxt.options.dev) return
  if (nuxt.options.test) return
  if (hub.devtools === false) return
  if (!hub.kv && !hub.blob && !hub.cache) return

  nuxt.hook('devtools:customTabs', (tabs) => {
    const { remoteBaseUrl, remotePathPrefix } = resolveDevtoolsConfig(hub)
    const localOrigin = getLocalOrigin(nuxt, hub)
    const remote = (store: string) => withQuery(joinURL(remoteBaseUrl, remotePathPrefix, store), { url: localOrigin })

    if (hub.kv) {
      tabs.push({
        category: 'server',
        name: 'hub-kv',
        title: 'KV',
        icon: 'i-lucide-key-round',
        // Avoid caching stale `?url=...` across restarts.
        view: { type: 'iframe', src: remote('kv'), persistent: false }
      })
    }
    if (hub.blob) {
      tabs.push({
        category: 'server',
        name: 'hub-blob',
        title: 'Blob',
        icon: 'i-lucide-hard-drive',
        view: { type: 'iframe', src: remote('blob'), persistent: false }
      })
    }
    if (hub.cache) {
      tabs.push({
        category: 'server',
        name: 'hub-cache',
        title: 'Cache',
        icon: 'i-lucide-zap',
        view: { type: 'iframe', src: remote('cache'), persistent: false }
      })
    }
  })
}
