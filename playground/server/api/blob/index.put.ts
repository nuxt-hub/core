export default eventHandler(async (event) => {
  return hubBlob().handleUpload(event, {
    formKey: 'file', // default
    multiple: true // default
  })
})
