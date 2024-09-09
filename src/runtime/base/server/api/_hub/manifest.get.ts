import { eventHandler } from 'h3'
import { hubAI } from '../../../../ai/server/utils/ai'
import { hubDatabase } from '../../../../database/server/utils/database'
import { hubKV } from '../../../../kv/server/utils/kv'
import { hubBlob } from '../../../../blob/server/utils/blob'
import { requireNuxtHubAuthorization } from '../../../../utils/auth'
import { useRuntimeConfig } from '#imports'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  const { version, cache, ai, analytics, browser, blob, kv, database } = useRuntimeConfig().hub
  const [aiCheck, dbCheck, kvCheck, blobCheck] = await Promise.all([
    falseIfFail(() => ai && hubAI().run('@cf/baai/bge-small-en-v1.5', { text: 'check' })),
    falseIfFail(() => database && hubDatabase().exec('PRAGMA table_list')),
    falseIfFail(() => kv && hubKV().getKeys('__check__')),
    falseIfFail(() => blob && hubBlob().list({ prefix: '__check__' }))
  ])

  return {
    version,
    storage: {
      database: Boolean(dbCheck),
      kv: Array.isArray(kvCheck),
      blob: Array.isArray(blobCheck?.blobs)
    },
    features: {
      ai: Boolean(aiCheck),
      analytics,
      browser,
      cache
    }
  }
})

async function falseIfFail(fn: () => any | Promise<any>) {
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
