export default eventHandler(async (event) => {
  const session = await requireUserSession(event)

  // List files for the current user
  const storage = await useBucket(event)

  console.log('storage', storage)

  // const keys = await storage.getKeys()
  // // const items = await storage.getItems(keys)
  // const items = await Promise.all(keys.map(async (key) => {
  //   const value = await storage.getItem(key)
  //   return { path: key, content: value }
  // }))
  return []
})
