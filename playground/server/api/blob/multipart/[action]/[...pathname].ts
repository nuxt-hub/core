export default eventHandler(async (event) => {
  return await hubBlob().handleMultipartUpload(event, {
    addRandomSuffix: true
  })
})
