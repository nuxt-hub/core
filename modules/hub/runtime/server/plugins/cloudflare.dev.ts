// @ts-ignore
import { defineNitroPlugin, useRuntimeConfig } from '#imports'

export default defineNitroPlugin(async (nitroApp) => {
  const proxyPromise = getBindingsProxy()

  nitroApp.hooks.hook('request', async (event) => {
    const proxy = await proxyPromise
    // Inject proxy bindings to the request context
    event.context.cloudflare = {
      ...event.context.cloudflare,
      env: proxy.bindings,
    }
  })

  // Dispose proxy when Nitro is closed
  nitroApp.hooks.hook('close', () => {
    return proxyPromise.then((proxy) => proxy.dispose())
  })
})

async function getBindingsProxy() {
  const _pkg = 'wrangler' // Bypass bundling!
  const { getBindingsProxy } = (await import(
    _pkg
  )) as typeof import('wrangler')

  const runtimeConfig: {
    wrangler: { configPath: string; persistDir: string };
  } = useRuntimeConfig()

  const proxy = await getBindingsProxy({
    configPath: runtimeConfig.wrangler.configPath,
    persist: { path: runtimeConfig.wrangler.persistDir },
  })

  Object.keys(proxy.bindings).forEach((key) => {
    if (!globalThis[key]) {
      globalThis[key] = proxy.bindings[key]
    }
  })

  // @ts-ignore
  await hubHooks.callHook('bindings:ready')

  return proxy
}
