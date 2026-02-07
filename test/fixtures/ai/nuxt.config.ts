import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: [
    '../basic'
  ],
  modules: [
    '../../../src/nuxt/module'
  ],
  hub: {
    ai: 'cloudflare'
  }
})
