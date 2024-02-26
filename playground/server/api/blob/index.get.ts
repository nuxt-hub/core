export default eventHandler(async () => {
  return hubBlob().list()
})
