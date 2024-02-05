import type { Storage } from 'unstorage'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import httpDriver from 'unstorage/drivers/http'
import cloudflareKVBindingDriver from 'unstorage/drivers/cloudflare-kv-binding'
import { join } from 'pathe'
import { joinURL } from 'ufo'

let _kv: Storage

export function useKV () {
  if (!_kv) {
    // TODO: same as database
    if (process.env.KV) {
      // kv in production
      _kv = createStorage({
        driver: cloudflareKVBindingDriver({
          binding: process.env.KV
        })
      })
    } else if (import.meta.dev && process.env.NUXT_HUB_URL) {
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
    } else if (import.meta.dev) {
      // local kv in development
      console.log('Using KV local namespace...')
      _kv = createStorage({
        driver: fsDriver({ base: join(process.cwd(), './.hub/kv') })
      })
    } else {
      throw new Error('No KV configured for production')
    }
  }

  return _kv
}
