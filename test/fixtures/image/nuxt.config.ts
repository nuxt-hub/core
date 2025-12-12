import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: [
    '../basic'
  ],
  modules: [
    '../../../src/module',
    '@nuxt/image'
  ],
  hub: {
    blob: {
      driver: 'fs',
      image: {
        path: '/images'
      }
    }
  }
})
