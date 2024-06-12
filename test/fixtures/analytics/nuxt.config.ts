import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '../../../src/module'
  ],
  hub: {
    analytics: true
  }
})
