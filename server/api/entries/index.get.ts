export default eventHandler(async (event) => {
  const session = await requireUserSession(event)

  // List entries for the current user
  const storage = await useKV(String(session.user!.id))

  const keys = await storage.getKeys()
  // const items = await storage.getItems(keys)
  const items = await Promise.all(keys.map(async (key) => {
    const value = await storage.getItem(key)
    return { key, value }
  }))
  return items
})
