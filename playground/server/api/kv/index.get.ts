export default eventHandler(async () => {
  // List entries for the current user
  const storage = useKV()

  const keys = await storage.getKeys()
  // const items = await storage.getItems(keys)
  const items = await Promise.all(keys.map(async (key) => {
    const value = await storage.getItem(key)
    return { key, value }
  }))
  return items
})
