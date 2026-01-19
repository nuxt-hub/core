import { blob } from '@nuxthub/blob'

export default eventHandler(async (event) => {
  return await blob.handleMultipartUpload(event, {
    addRandomSuffix: true,
    access: 'public'
  })
})
