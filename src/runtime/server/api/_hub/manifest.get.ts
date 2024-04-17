import { eventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'
import { hubDatabase } from '../../utils/database'
import { hubKV } from '../../utils/kv'
import { hubBlob } from '../../utils/blob'
import { requireNuxtHubAuthorization } from '../../utils/auth'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  const { version, cache } = useRuntimeConfig().hub
  const [ dbCheck, kvCheck, blobCheck ] = await Promise.all([
    falseIfFail(() => hubDatabase().exec('PRAGMA table_list')),
    falseIfFail(() => hubKV().getKeys('__check__')),
    falseIfFail(() => hubBlob().list({ prefix: '__check__' }))
  ])

  return {
    version,
    storage: {
      database: Boolean(dbCheck),
      kv: Array.isArray(kvCheck),
      blob: Array.isArray(blobCheck),
    },
    features: {
      cache
    }
  }
})

async function falseIfFail (fn: () => any | Promise<any>) {
  try {
    const res = fn()
    if (res instanceof Promise) {
      return res.catch(() => false)
    }
    return res
  } catch (e) {
    return false
  }
}
