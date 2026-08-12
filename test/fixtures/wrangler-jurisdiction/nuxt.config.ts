import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: ['../basic'],
  modules: ['../../../src/module'],
  hub: {
    blob: { driver: 'cloudflare-r2', bucketName: 'test-bucket', binding: 'BLOB', jurisdiction: 'eu' }
  }
})
