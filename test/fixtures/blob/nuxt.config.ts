import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: [
    '../basic'
  ],
  modules: [
    '../../../src/module'
  ],
  hub: {
    blob: true
  }
})
