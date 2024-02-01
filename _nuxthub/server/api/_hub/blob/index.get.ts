export default eventHandler(async (event) => {
  return useBlob().list()
})
