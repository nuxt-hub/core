import type { Storage } from 'unstorage'

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
