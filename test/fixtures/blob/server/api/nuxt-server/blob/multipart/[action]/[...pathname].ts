import { defineEventHandler } from 'nuxt/server'
import { blob } from 'hub:blob'

export default defineEventHandler(async (event) => {
  return blob.handleMultipartUpload(event)
})
