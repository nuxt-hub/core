import { AsyncLocalStorage } from 'node:async_hooks'
import { defineDriver } from 'unstorage'
import cloudflareKVBindingDriver from 'unstorage/drivers/cloudflare-kv-binding'
import { getContext } from 'unctx'

export const nitroAsyncContext = getContext('nitro-app', {
  asyncContext: true,
  AsyncLocalStorage
})

export default defineDriver((driverOpts) => {
  const driver = cloudflareKVBindingDriver(driverOpts)

  return {
    name: 'nuxthub-cache',
    ...driver,
    setItem(key, value, options) {
      const event = nitroAsyncContext.tryUse()?.event
      // TODO: remove this if once Nitro 2.10 is out with Nuxt version
      // As this does not support properly swr (as expiration should not be used)
      // Fallback to expires value ({"expires":1729118447040,...})
      if (!options.ttl && typeof value === 'string') {
        const expires = value.match(/^\{"expires":(\d+),/)?.[1]
        if (expires) {
          options.ttl = Math.round((Number(expires) - Date.now()) / 1000)
        }
      }
      if (options.ttl) {
        // Make sure to have a ttl of at least 60 seconds (Cloudflare KV limitation)
        options.ttl = Math.max(options.ttl, 60)
      }

      options.metadata = {
        ttl: options.ttl,
        mtime: Date.now(),
        size: value.length,
        path: event?.path,
        ...options.metadata
      }
      if (!options.ttl) {
        delete options.ttl
      }
      return driver.setItem(key, value, options)
    }
  }
})
