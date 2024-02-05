export default eventHandler(async (event) => {
  await requireUserSession(event)

  return useBlob().list()
})
