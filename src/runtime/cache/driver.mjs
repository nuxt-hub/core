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
