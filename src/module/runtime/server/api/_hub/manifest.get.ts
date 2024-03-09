import { eventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'

export default eventHandler(async () => {
  const { version } = useRuntimeConfig().hub
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
      blob: Array.isArray(blobCheck)
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
