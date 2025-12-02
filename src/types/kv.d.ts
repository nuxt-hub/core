import type { Storage } from 'unstorage'

export interface HubKV extends Storage {
  /**
   * Get all keys from the storage.
   *
   * @see https://hub.nuxt.com/docs/features/kv#list-all-keys
   */
  keys: Storage['getKeys']
  /**
   * Get an item from the storage.
   *
   * @param key The key to get
   *
   * @see https://hub.nuxt.com/docs/features/kv#get-an-item
   */
  get: Storage['getItem']
  /**
   * Set an item in the storage.
   *
   * @param key The key to set
   * @param value The value to set
   * @param options The options to set (optional)
   * @param options.ttl The time to live in seconds (optional)
   *
   * @see https://hub.nuxt.com/docs/features/kv#set-an-item
   */
  set: Storage['setItem']
  /**
   * Check if an item exists in the storage.
   *
   * @param key The key to check
   *
   * @see https://hub.nuxt.com/docs/features/kv#has-an-item
   */
  has: Storage['hasItem']
  /**
   * Delete an item from the storage.
   *
   * @param key The key to delete
   *
   * @see https://hub.nuxt.com/docs/features/kv#delete-an-item
   */
  del: Storage['removeItem']
  /**
   * Clear the storage.
   *
   * @see https://hub.nuxt.com/docs/features/kv#clear-the-kv-namespace
   */
  clear: Storage['clear']
}

declare module 'hub:kv' {
  /**
   * The KV storage instance.
   *
   * @example ```ts
   * import { kv } from 'hub:kv'
   *
   * await kv.set('key', 'value')
   * const value = await kv.get('key')
   * ```
   *
   * @see https://hub.nuxt.com/docs/features/kv
   */
  export const kv: HubKV
}
