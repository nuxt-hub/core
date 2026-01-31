import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: ['../basic'],
  modules: ['../../../src/module'],
  hub: {
    db: { orm: 'drizzle', dialect: 'sqlite' }
  }
})
