import type { NitroAppPlugin } from 'nitropack'
import type { GetPlatformProxyOptions } from 'wrangler'
// @ts-expect-error - virtual import
import { useRuntimeConfig } from '#imports'

const _proxy = _getPlatformProxy()
  .catch((error) => {
    console.error('[nuxt:hub] Failed to initialize remote Cloudflare bindings')
    console.error('[nuxt:hub] Error:', error.message || error)
    console.error('[nuxt:hub] Ensure you are logged into wrangler: `npx wrangler login`')
    console.error('[nuxt:hub] Verify your binding IDs are correct in nuxt.config')
    throw new Error(`[nuxt:hub] Cannot start in remote mode: ${error.message || error}`)
  })
  .then((proxy) => {
    (globalThis as any).__env__ = proxy.env
    return proxy
  })

// Initially set __env__ as a Promise that resolves to env
;(globalThis as any).__env__ = _proxy.then(proxy => proxy.env)

export default <NitroAppPlugin> function (nitroApp) {
  nitroApp.hooks.hook('request', async (event) => {
    const proxy = await _proxy

    event.context.cf = proxy.cf
    event.context.waitUntil = proxy.ctx.waitUntil.bind(proxy.ctx)

    event.context.cloudflare = {
      ...event.context.cloudflare,
      env: proxy.env,
      context: proxy.ctx
    }

    ;(event.node.req as any).__unenv__ = {
      ...(event.node.req as any).__unenv__,
      waitUntil: event.context.waitUntil
    }
  })

  // Ensure our hook runs first
  // @ts-expect-error - accessing internal hooks
  nitroApp.hooks._hooks.request?.unshift(nitroApp.hooks._hooks.request?.pop())

  nitroApp.hooks.hook('close', () => {
    return _proxy?.then(proxy => proxy.dispose())
  })
}

async function _getPlatformProxy() {
  const _pkg = 'wrangler'
  const { getPlatformProxy } = (await import(_pkg).catch(() => {
    throw new Error('[nuxt:hub] Package `wrangler` not found. Please install it with: `npx nypm@latest add -D wrangler`')
  })) as typeof import('wrangler')

  const runtimeConfig = useRuntimeConfig() as {
    hub: {
      _remote: { configPath: string, persistDir: string }
    }
  }

  const proxyOptions: GetPlatformProxyOptions = {
    configPath: runtimeConfig.hub._remote.configPath,
    persist: { path: runtimeConfig.hub._remote.persistDir }
  }

  return await getPlatformProxy(proxyOptions)
}
