import { existsSync } from 'node:fs'
import { addServerHandler, addVitePlugin, createResolver, extendViteConfig } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import type { HubConfig } from '@nuxthub/core'
import { DEVTOOLS_UI_PORT, DEVTOOLS_UI_ROUTE } from './constants'

export async function setupDevTools(nuxt: Nuxt, hub: HubConfig) {
  if (!nuxt.options.dev) return
  if (nuxt.options.test) return
  if (!hub.kv && !hub.blob && !hub.cache) return

  const { resolve } = createResolver(import.meta.url)

  // Register server handlers
  if (hub.kv) {
    addServerHandler({ route: '/_hub/devtools/kv', method: 'get', handler: resolve('../devtools-runtime/server/api/kv/index.get') })
    addServerHandler({ route: '/_hub/devtools/kv/clear', method: 'post', handler: resolve('../devtools-runtime/server/api/kv/clear.post') })
    addServerHandler({ route: '/_hub/devtools/kv/:key', handler: resolve('../devtools-runtime/server/api/kv/[key]') })
  }
  if (hub.blob) {
    addServerHandler({ route: '/_hub/devtools/blob', method: 'get', handler: resolve('../devtools-runtime/server/api/blob/index.get') })
    addServerHandler({ route: '/_hub/devtools/blob/**:pathname', handler: resolve('../devtools-runtime/server/api/blob/[...pathname]') })
  }
  if (hub.cache) {
    addServerHandler({ route: '/_hub/devtools/cache', method: 'get', handler: resolve('../devtools-runtime/server/api/cache/index.get') })
    addServerHandler({ route: '/_hub/devtools/cache/clear', method: 'post', handler: resolve('../devtools-runtime/server/api/cache/clear.post') })
    addServerHandler({ route: '/_hub/devtools/cache/:key', handler: resolve('../devtools-runtime/server/api/cache/[key]') })
  }

  // Setup client serving
  const clientPath = resolve('../devtools-client')
  const isProductionBuild = existsSync(clientPath)

  if (isProductionBuild) {
    // Production: serve pre-built client with sirv
    addVitePlugin({
      name: 'nuxthub-devtools-ui',
      async configureServer(server) {
        const sirv = await import('sirv').then(r => r.default || r)
        server.middlewares.use(DEVTOOLS_UI_ROUTE, sirv(clientPath, { dev: true, single: true }))
      }
    })
  } else {
    // Dev mode: Vite proxy to separately-running devtools client
    extendViteConfig((config) => {
      config.server = config.server || {}
      config.server.proxy = config.server.proxy || {}
      config.server.proxy[DEVTOOLS_UI_ROUTE] = {
        target: `http://localhost:${DEVTOOLS_UI_PORT}`,
        changeOrigin: true,
        ws: true
      }
    })
  }
}

export function addDevToolsStorageTabs(nuxt: Nuxt, hub: HubConfig) {
  if (!nuxt.options.dev) return
  if (nuxt.options.test) return
  if (!hub.kv && !hub.blob && !hub.cache) return

  nuxt.hook('devtools:customTabs', (tabs) => {
    if (hub.kv) {
      tabs.push({
        category: 'server',
        name: 'hub-kv',
        title: 'KV',
        icon: 'i-lucide-key-round',
        view: { type: 'iframe', src: `${DEVTOOLS_UI_ROUTE}/kv-storage` }
      })
    }
    if (hub.blob) {
      tabs.push({
        category: 'server',
        name: 'hub-blob',
        title: 'Blob',
        icon: 'i-lucide-hard-drive',
        view: { type: 'iframe', src: `${DEVTOOLS_UI_ROUTE}/blob-storage` }
      })
    }
    if (hub.cache) {
      tabs.push({
        category: 'server',
        name: 'hub-cache',
        title: 'Cache',
        icon: 'i-lucide-zap',
        view: { type: 'iframe', src: `${DEVTOOLS_UI_ROUTE}/cache-storage` }
      })
    }
  })
}
