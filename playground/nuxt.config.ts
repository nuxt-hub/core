import { createResolver } from 'nuxt/kit'
import module from '../src/module'
import { provider } from 'std-env'

const resolver = createResolver(import.meta.url)

export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxtjs/mdc',
    // '@kgierke/nuxt-basic-auth',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
    module
  ],
  devtools: { enabled: true },
  css: ['~/assets/main.css'],

  routeRules: {
    '/cached': { prerender: true }
  },

  compatibilityDate: '2025-09-09',

  nitro: {
    // preset: 'cloudflare-durable',
    experimental: {
      database: true,
      openAPI: true,
      websocket: true
    }
  },

  hub: {
    ai: provider.includes('cloudflare') ? 'cloudflare' : 'vercel',
    database: 'sqlite',
    blob: true,
    kv: true,
    cache: true
  },
  hooks: {
    'hub:database:migrations:dirs': (dirs) => {
      dirs.push('my-module/database/migrations')
    },
    'hub:database:queries:paths': (queries, dialect) => {
      queries.push(resolver.resolve(`server/database/queries/admin.${dialect}.sql`))
    }
  },

  basicAuth: {
    enabled: process.env.NODE_ENV === 'production',
    users: [
      {
        username: 'admin',
        password: process.env.NUXT_ADMIN_PASSWORD || 'admin'
      }
    ]
  }
})
