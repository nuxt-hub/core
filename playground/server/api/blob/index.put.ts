export default eventHandler(async (event) => {
  const { prefix } = getQuery(event)
  return hubBlob().handleUpload(event, {
    formKey: 'files', // default
    multiple: true, // default
    prefix: String(prefix || '')
  })
})
