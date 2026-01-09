import type { NitroAppPlugin } from 'nitropack'
import type { GetPlatformProxyOptions } from 'wrangler'
// @ts-expect-error - virtual import
import { useRuntimeConfig } from '#imports'

// Track initialization state to provide helpful errors
let _initError: Error | null = null

const _proxy = _getPlatformProxy()
  .catch((error) => {
    const isAuthError = error.message?.includes('login') || error.message?.includes('auth')
    const isNetworkError = error.message?.includes('ENOTFOUND') || error.message?.includes('network')

    console.error('[nuxt:hub] Failed to initialize remote Cloudflare bindings')
    console.error('[nuxt:hub] Error:', error.message || error)

    if (isAuthError) {
      console.error('[nuxt:hub] This appears to be an authentication issue.')
      console.error('[nuxt:hub] Ensure you are logged into wrangler: `npx wrangler login`')
    } else if (isNetworkError) {
      console.error('[nuxt:hub] This appears to be a network issue.')
      console.error('[nuxt:hub] Check your internet connection and try again.')
    } else {
      console.error('[nuxt:hub] Verify your binding IDs are correct in nuxt.config')
    }

    _initError = new Error(`[nuxt:hub] Cannot start in remote mode: ${error.message || error}`)
    throw _initError
  })
  .then((proxy) => {
    // Only set __env__ once proxy is successfully resolved
    ;(globalThis as any).__env__ = proxy.env
    return proxy
  })

// Create a proxy that throws helpful errors when accessed before initialization
// or when initialization failed
;(globalThis as any).__env__ = new Proxy({}, {
  get(_, prop) {
    if (_initError) {
      throw _initError
    }
    throw new Error(`[nuxt:hub] Cloudflare bindings not ready. The "${String(prop)}" binding was accessed before initialization completed.`)
  }
})

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
      _remote?: { configPath: string, persistDir: string }
    }
  }

  if (!runtimeConfig.hub._remote) {
    throw new Error('[nuxt:hub] Remote configuration not found. This plugin should only be loaded when hub.remote is true.')
  }

  const proxyOptions: GetPlatformProxyOptions = {
    configPath: runtimeConfig.hub._remote.configPath,
    persist: { path: runtimeConfig.hub._remote.persistDir }
  }

  return await getPlatformProxy(proxyOptions)
}
