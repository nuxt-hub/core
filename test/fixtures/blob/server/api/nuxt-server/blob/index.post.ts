import { defineEventHandler } from 'nuxt/server'
import { blob } from 'hub:blob'

export default defineEventHandler(async (event) => {
  return blob.handleUpload(event, {
    formKey: 'file',
    multiple: false,
    ensure: { maxSize: '1MB', types: ['text'] }
  })
})
