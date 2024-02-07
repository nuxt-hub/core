import type { Storage } from 'unstorage'
import { createStorage } from 'unstorage'
import httpDriver from 'unstorage/drivers/http'
import cloudflareKVBindingDriver from 'unstorage/drivers/cloudflare-kv-binding'
import { joinURL } from 'ufo'

let _kv: Storage

export function useKV() {
  if (_kv) {
    return _kv
  }
  if (import.meta.dev && process.env.NUXT_HUB_URL) {
    return useProxyKV(process.env.NUXT_HUB_URL, process.env.NUXT_HUB_SECRET_KEY)
  }
  const binding = process.env.KV || globalThis.__env__?.KV || globalThis.KV
  if (binding) {
    _kv = createStorage({
      driver: cloudflareKVBindingDriver({
        binding
      })
    })
    return _kv
  }
  throw createError('Missing Cloudflare KV binding (KV)')
}

export function useProxyKV(projectUrl: string, secretKey?: string) {
  return createStorage({
    driver: httpDriver({
      base: joinURL(projectUrl, '/api/_hub/kv/'),
      headers: {
        Authorization: `Bearer ${secretKey}`
      }
    })
  })
}
