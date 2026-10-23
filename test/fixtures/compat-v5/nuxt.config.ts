import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: [
    '../basic'
  ],
  modules: [
    '../../../src/module'
  ],
  future: {
    compatibilityVersion: 5
  },
  hub: {
    db: 'sqlite',
    kv: true,
    blob: true,
    cache: true
  }
})
