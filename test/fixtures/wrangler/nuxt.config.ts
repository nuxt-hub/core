import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: ['../basic'],
  modules: ['../../../src/nuxt/module'],
  hub: {
    blob: { driver: 'cloudflare-r2', bucketName: 'test-bucket', binding: 'BLOB' },
    kv: { driver: 'cloudflare-kv-binding', namespaceId: 'test-kv-id', binding: 'KV' },
    cache: { driver: 'cloudflare-kv-binding', namespaceId: 'test-cache-id', binding: 'CACHE' },
    db: { dialect: 'sqlite', driver: 'd1', connection: { databaseId: 'test-db-id' } }
  }
})
