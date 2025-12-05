import { kv } from 'hub:kv'
import type { KVStorage } from '@nuxthub/core/kv'

export default eventHandler(async (event) => {
  // List entries for the current user
  const { prefix = '' } = getQuery(event)

  const keys = await kv.keys(prefix as string)

  // const items = await storage.getItems(keys)
  const items = await Promise.all(keys.map(async (key) => {
    const value = await kv.get(key)
    return { key, value }
  }))
  return items
})
