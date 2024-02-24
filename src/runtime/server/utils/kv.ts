import type { Storage } from 'unstorage'
import { createStorage } from 'unstorage'
import httpDriver from 'unstorage/drivers/http'
import cloudflareKVBindingDriver from 'unstorage/drivers/cloudflare-kv-binding'
import { joinURL } from 'ufo'
import { createError } from 'h3'
import { useRuntimeConfig } from '#imports'

let _kv: Storage

export function useKV(): Storage {
  if (_kv) {
    return _kv
  }
  const hub = useRuntimeConfig().hub
  if (import.meta.dev && hub.projectUrl) {
    return useProxyKV(hub.projectUrl, hub.projectSecretKey || hub.userToken)
  }
  // @ts-ignore
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

export function useProxyKV(projectUrl: string, secretKey?: string): Storage {
  return createStorage({
    driver: httpDriver({
      base: joinURL(projectUrl, '/api/_hub/kv/'),
      headers: {
        Authorization: `Bearer ${secretKey}`
      }
    })
  })
}
