import type { NitroAppPlugin } from 'nitropack'
// @ts-ignore
import { useRuntimeConfig } from '#imports'

export default <NitroAppPlugin>function (nitroApp) {
  let _proxy: ReturnType<typeof getBindingsProxy>

  nitroApp.hooks.hook('request', async (event) => {
    // Lazy initialize proxy when first request comes in
    if (!_proxy) {
      _proxy = getBindingsProxy().catch((error) => {
        console.error('Failed to initialize wrangler bindings proxy', error)
        return { bindings: {}, dispose: () => Promise.resolve() }
      })
    }

    // Inject proxy bindings to the request context
    const bindings = (await _proxy).bindings
    Object.keys(bindings).forEach((key) => {
      if (!globalThis[key]) {
        globalThis[key] = bindings[key]
      }
    })
    event.context.cloudflare = {
      ...event.context.cloudflare,
      env: bindings,
    }
  })

  // Dispose proxy when Nitro is closed
  nitroApp.hooks.hook('close', () => {
    return _proxy?.then((proxy) => proxy.dispose)
  })
}

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

  return proxy
}