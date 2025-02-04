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
    setItem(key, value, options = {}) {
      const event = nitroAsyncContext.tryUse()?.event
      let ttl = options.ttl
      // If SWR, ttl is not set as options from Nitro
      // Guess from expires value ({"expires":1729118447040,...})
      if (typeof ttl === 'undefined' && typeof value === 'string') {
        const expires = value.match(/[{,]"expires":(\d+)[,}]/)?.[1]
        if (expires) {
          ttl = Math.round((Number(expires) - Date.now()) / 1000)
        }
      }

      options.metadata = {
        ttl,
        swr: typeof options.ttl === 'undefined',
        mtime: Date.now(),
        size: value.length,
        path: event?.path,
        ...options.metadata
      }
      if (options.ttl) {
        // Make sure to have a ttl of at least 60 seconds (Cloudflare KV limitation)
        options.ttl = Math.max(options.ttl, 60)
      } else {
        // make sure ttl = 0 is deleted
        delete options.ttl
      }
      return driver.setItem(key, value, options)
    }
  }
})
