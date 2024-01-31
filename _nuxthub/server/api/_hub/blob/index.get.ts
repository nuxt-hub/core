export default eventHandler(async (event) => {
  // TODO: handle authorization

  return useBlob().list()
})
