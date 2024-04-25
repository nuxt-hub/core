export default eventHandler(async (event) => {
  await hubBlob().handleMultipartUpload(event)
})
