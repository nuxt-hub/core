export default eventHandler(async (event) => {
  const [ dbCheck, kvCheck, blobCheck ] = await Promise.all([
    useDatabase().exec('PRAGMA table_list').catch(() => false),
    useKV().getKeys('__check__').catch(() => false),
    useBlob().list({ prefix: '__check__' }).catch(() => false)
  ])

  return {
    database: Boolean(dbCheck),
    kv: Array.isArray(kvCheck),
    blob: Array.isArray(blobCheck),
  }
})
