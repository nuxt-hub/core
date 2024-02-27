import type { Storage } from 'unstorage'
import { createStorage } from 'unstorage'
import httpDriver from 'unstorage/drivers/http'
import cloudflareKVBindingDriver from 'unstorage/drivers/cloudflare-kv-binding'
import { joinURL } from 'ufo'
import { createError } from 'h3'
import { useRuntimeConfig } from '#imports'

export interface HubKV extends Storage {
  keys: Storage['getKeys']
  get: Storage['getItem']
  set: Storage['setItem']
  has: Storage['hasItem']
  del: Storage['removeItem']
}

let _kv: HubKV

export function hubKV(): HubKV {
  if (_kv) {
    return _kv
  }
  const hub = useRuntimeConfig().hub
  if (import.meta.dev && hub.projectUrl) {
    return proxyHubKV(hub.projectUrl, hub.projectSecretKey || hub.userToken)
  }
  // @ts-ignore
  const binding = process.env.KV || globalThis.__env__?.KV || globalThis.KV
  if (binding) {
    const storage = createStorage({
      driver: cloudflareKVBindingDriver({
        binding
      })
    })
    _kv = {
      keys: storage.getKeys,
      get: storage.getItem,
      set: storage.setItem,
      has: storage.hasItem,
      del: storage.removeItem,
      ...storage,
    }
    return _kv
  }
  throw createError('Missing Cloudflare KV binding (KV)')
}

export function proxyHubKV(projectUrl: string, secretKey?: string): HubKV {
  const storage = createStorage({
    driver: httpDriver({
      base: joinURL(projectUrl, '/api/_hub/kv/'),
      headers: {
        Authorization: `Bearer ${secretKey}`
      }
    })
  })

  return {
    keys: storage.getKeys,
    get: storage.getItem,
    set: storage.setItem,
    has: storage.hasItem,
    del: storage.removeItem,
    ...storage,
  }
}
