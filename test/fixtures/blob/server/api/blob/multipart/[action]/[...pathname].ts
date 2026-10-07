import { eventHandler } from 'h3'
import { blob } from 'hub:blob'

export default eventHandler(async (event) => {
  return blob.handleMultipartUpload(event)
})
