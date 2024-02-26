export default eventHandler(async () => {
  // List entries for the current user
  const kv = hubKV()

  const keys = await kv.keys()
  // const items = await storage.getItems(keys)
  const items = await Promise.all(keys.map(async (key) => {
    const value = await kv.get(key)
    return { key, value }
  }))
  return items
})
