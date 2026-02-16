import { createResolver } from '@nuxt/kit'
import module from '../src/module'

const resolver = createResolver(import.meta.url)

export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
    module
  ],
  devtools: { enabled: true },
  css: ['~/assets/main.css'],

  routeRules: {
    '/cached': { prerender: true }
  },

  compatibilityDate: '2025-12-11',

  nitro: {
    // preset: 'cloudflare-module',
    experimental: {
      websocket: true
    }
  },

  hub: {
    // db: 'sqlite',
    db: {
      dialect: 'sqlite',
      driver: 'd1'
    },
    blob: true,
    kv: true,
    cache: true
  },
  hooks: {
    'hub:db:migrations:dirs': (dirs) => {
      dirs.push('my-module/db/migrations')
    },
    'hub:db:queries:paths': (queries, dialect) => {
      queries.push(resolver.resolve(`server/db/queries/admin.${dialect}.sql`))
    }
  }
})
