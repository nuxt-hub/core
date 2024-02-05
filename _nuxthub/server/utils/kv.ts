import type { Storage } from 'unstorage'
import { createStorage } from 'unstorage'
import httpDriver from 'unstorage/drivers/http'
import cloudflareKVBindingDriver from 'unstorage/drivers/cloudflare-kv-binding'
import { joinURL } from 'ufo'

let _kv: Storage

export function useKV () {
  if (!_kv) {
    if (import.meta.dev && process.env.NUXT_HUB_URL) {
      console.log('Using KV remote namespace...')
      // Use https://unstorage.unjs.io/drivers/http
      _kv = createStorage({
        driver: httpDriver({
          base: joinURL(process.env.NUXT_HUB_URL, '/api/_hub/kv/'),
          headers: {
            Authorization: `Bearer ${process.env.NUXT_HUB_SECRET_KEY}`
          }
        })
      })
    } else {
      const binding = process.env.KV || globalThis.__env__?.KV || globalThis.KV
      if (binding) {
        _kv = createStorage({
          driver: cloudflareKVBindingDriver({
            binding
          })
        })
      } else {
        throw createError('Missing Cloudflare binding KV')
      }
    }
  }

  return _kv
}
