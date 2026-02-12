import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: [
    '../basic'
  ],
  modules: [
    '../../../src/module'
  ],
  nitro: {
    experimental: {
      openAPI: true
    }
  }
})
