import { blob } from 'hub:blob'

export default eventHandler(async (event) => {
  return await blob.handleMultipartUpload(event, {
    addRandomSuffix: true,
    access: 'public'
  })
})
