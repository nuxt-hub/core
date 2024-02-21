import type { H3Event } from 'h3'
import type { NitroApp } from 'nitropack'
// @ts-ignore
import { defineNitroPlugin, useRuntimeConfig } from '#imports'
import { hubHooks } from '../utils/hooks'

export default defineNitroPlugin(async (nitroApp: NitroApp) => {
  const proxyPromise = getBindingsProxy()

  nitroApp.hooks.hook('request', async (event: H3Event) => {
    const proxy = await proxyPromise
    // Inject proxy bindings to the request context
    // https://github.com/unjs/nitro/blob/main/src/runtime/entries/cloudflare-pages.ts
    event.context.cloudflare = {
      ...event.context.cloudflare,
      request: proxy.cf,
      env: proxy.env,
      context: proxy.ctx
    }
    event.context.waitUntil = proxy.ctx.waitUntil
    // Also inject globally
    Object.keys(proxy.env).forEach((key) => {
      // @ts-ignore
      if (!globalThis[key]) {
        // @ts-ignore
        globalThis[key] = proxy.env[key]
      }
    })
  })

  // Dispose proxy when Nitro is closed
  nitroApp.hooks.hook('close', () => {
    return proxyPromise.then((proxy) => proxy.dispose())
  })
})

async function getBindingsProxy() {
  const _pkg = 'wrangler' // Bypass bundling!
  const { getPlatformProxy } = (await import(
    _pkg
  )) as typeof import('wrangler')

  const wranglerConfig = useRuntimeConfig().wrangler as { configPath: string; persistDir: string }

  const proxy = await getPlatformProxy({
    configPath: wranglerConfig.configPath,
    persist: { path: wranglerConfig.persistDir },
  })

  Object.keys(proxy.env).forEach((key) => {
    // @ts-ignore
    if (!globalThis[key]) {
    // @ts-ignore
      globalThis[key] = proxy.env[key]
    }
  })

  await hubHooks.callHook('bindings:ready')

  return proxy
}
