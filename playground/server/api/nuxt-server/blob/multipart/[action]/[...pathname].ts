import { defineEventHandler } from 'nuxt/server'
import { blob } from '@nuxthub/blob'

export default defineEventHandler(async (event) => {
  return blob.handleMultipartUpload(event, {
    addRandomSuffix: true,
    access: 'public'
  })
})
