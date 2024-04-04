import type { Storage } from 'unstorage'
import { createStorage } from 'unstorage'
import httpDriver from 'unstorage/drivers/http'
import cloudflareKVBindingDriver from 'unstorage/drivers/cloudflare-kv-binding'
import { joinURL } from 'ufo'
import { createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import { requireNuxtHubFeature } from './features'

export interface HubKV extends Storage {
  /**
   * Get all keys from the storage.
   *
   * @see https://hub.nuxt.com/docs/storage/kv#keys
   */
  keys: Storage['getKeys']
  /**
   * Get an item from the storage.
   *
   * @param key The key to get
   *
   * @see https://hub.nuxt.com/docs/storage/kv#get
   */
  get: Storage['getItem']
  /**
   * Set an item in the storage.
   *
   * @param key The key to set
   * @param value The value to set
   *
   * @see https://hub.nuxt.com/docs/storage/kv#set
   */
  set: Storage['setItem']
  /**
   * Check if an item exists in the storage.
   *
   * @param key The key to check
   *
   * @see https://hub.nuxt.com/docs/storage/kv#has
   */
  has: Storage['hasItem']
  /**
   * Delete an item from the storage.
   *
   * @param key The key to delete
   *
   * @see https://hub.nuxt.com/docs/storage/kv#del
   */
  del: Storage['removeItem']
}

let _kv: HubKV

/**
 * Access the Key-Value storage.
 *
 * @example ```ts
 * const kv = hubKV()
 * await kv.set('key', 'value')
 * ```
 *
 * @see https://hub.nuxt.com/docs/storage/kv
 */
export function hubKV(): HubKV {
  requireNuxtHubFeature('kv')

  if (_kv) {
    return _kv
  }
  const hub = useRuntimeConfig().hub
  // @ts-ignore
  const binding = process.env.KV || globalThis.__env__?.KV || globalThis.KV
  if (hub.remote && hub.projectUrl && !binding) {
    return proxyHubKV(hub.projectUrl, hub.projectSecretKey || hub.userToken)
  }
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

/**
 * Access the remote Key-Value storage.
 *
 * @param projectUrl The project URL (e.g. https://my-deployed-project.nuxt.dev)
 * @param secretKey The secret key to authenticate to the remote endpoint
 *
 * @example ```ts
 * const kv = proxyHubKV('https://my-deployed-project.nuxt.dev', 'my-secret-key')
 * await kv.set('key', 'value')
 * ```
 *
 * @see https://hub.nuxt.com/docs/storage/kv
 */
export function proxyHubKV(projectUrl: string, secretKey?: string): HubKV {
  requireNuxtHubFeature('kv')

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
