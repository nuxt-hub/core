import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['../../../src/module'],
  hub: {
    db: {
      dialect: 'postgresql',
      driver: 'postgres-js',
      applyMigrationsDuringBuild: false,
      connection: {
        hyperdriveId: 'test-hyperdrive-id',
        url: 'postgresql://user:pass@localhost:5432/db',
        prepare: false
      }
    }
  },
  nitro: {
    preset: 'cloudflare-module',
    cloudflare: {
      wrangler: {
        name: 'hub-hyperdrive-postgres-test'
      }
    }
  }
})
