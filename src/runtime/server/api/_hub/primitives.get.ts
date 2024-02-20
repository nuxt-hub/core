export default eventHandler(async () => {
  const [ dbCheck, kvCheck, blobCheck ] = await Promise.all([
    falseIfFail(() => useDatabase().exec('PRAGMA table_list')),
    falseIfFail(() => useKV().getKeys('__check__')),
    falseIfFail(() => useBlob().list({ prefix: '__check__' }))
  ])

  return {
    database: Boolean(dbCheck),
    kv: Array.isArray(kvCheck),
    blob: Array.isArray(blobCheck),
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
