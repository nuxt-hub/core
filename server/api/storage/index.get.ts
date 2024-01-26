export default eventHandler(async (event) => {
  const session = await requireUserSession(event)

  // List files for the current user

  const res = await useBucket().list()

  return res.objects

  // const keys = await storage.getKeys()
  // // const items = await storage.getItems(keys)
  // const items = await Promise.all(keys.map(async (key) => {
  //   const value = await storage.getItem(key)
  //   return { path: key, content: value }
  // }))
  // return []
})
