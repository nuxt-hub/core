import { eventHandler } from 'h3'
import { hubDatabase } from '../../../../database/server/utils/database'
import { hubKV } from '../../../../kv/server/utils/kv'
import { hubBlob } from '../../../../blob/server/utils/blob'
import { hubVectorize } from '../../../../vectorize/server/utils/vectorize'
import { requireNuxtHubAuthorization } from '../../../../utils/auth'
import { useRuntimeConfig } from '#imports'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  const { version, cache, ai, analytics, browser, blob, kv, database, vectorize } = useRuntimeConfig().hub
  const [dbCheck, kvCheck, blobCheck, vectorizeCheck] = await Promise.all([
    falseIfFail(() => database && hubDatabase().exec('PRAGMA table_list')),
    falseIfFail(() => kv && hubKV().getKeys('__check__')),
    falseIfFail(() => blob && hubBlob().list({ prefix: '__check__' })),
    // vectorize check should verify all indexes. return the index name
    Promise.all(Object.keys(vectorize).map(async (index) => {
      const vectorizeIndex = hubVectorize(index)
      const describe = await falseIfFail(() => vectorizeIndex.describe())
      return [index, Boolean(describe)]
    }))
  ])

  const enabledVectorizeIndexes = Object.fromEntries(Object.entries(vectorize).filter(([index]) => vectorizeCheck.find(([name, enabled]) => name === index && enabled)))

  return {
    version,
    storage: {
      database: Boolean(dbCheck),
      kv: Array.isArray(kvCheck),
      blob: Array.isArray(blobCheck?.blobs),
      vectorize: enabledVectorizeIndexes
    },
    features: {
      ai,
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
