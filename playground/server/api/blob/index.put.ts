import { blob } from 'hub:blob'

export default eventHandler(async (event) => {
  const { prefix } = getQuery(event)
  return blob.handleUpload(event, {
    formKey: 'files', // default
    multiple: true, // default
    put: {
      prefix: String(prefix || ''),
      customMetadata: {
        hello: 'world'
      }
    }
  })
})
