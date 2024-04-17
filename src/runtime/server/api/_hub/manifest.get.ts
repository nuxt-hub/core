import { eventHandler } from 'h3'
import { useRuntimeConfig, useStorage } from '#imports'
import { hubDatabase } from '../../utils/database'
import { hubKV } from '../../utils/kv'
import { hubBlob } from '../../utils/blob'
import { requireNuxtHubAuthorization } from '../../utils/auth'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  const { version } = useRuntimeConfig().hub
  const [ dbCheck, kvCheck, blobCheck, cacheCheck ] = await Promise.all([
    falseIfFail(() => hubDatabase().exec('PRAGMA table_list')),
    falseIfFail(() => hubKV().getKeys('__check__')),
    falseIfFail(() => hubBlob().list({ prefix: '__check__' })),
    falseIfFail(() => useStorage('cache:nitro').getKeys('__check__'))
  ])

  return {
    version,
    storage: {
      database: Boolean(dbCheck),
      kv: Array.isArray(kvCheck),
      blob: Array.isArray(blobCheck),
      cache: Array.isArray(cacheCheck),
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
