// import { encodeHost } from 'ufo'
import { createResolver } from 'nuxt/kit'
import module from '../src/module'

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

  routeRules: {
    '/cached': { prerender: true }
  },
  future: { compatibilityVersion: 4 },

  compatibilityDate: '2025-01-22',

  nitro: {
    // preset: 'cloudflare-durable',
    experimental: {
      database: true,
      openAPI: true,
      websocket: true
    }
  },

  hub: {
    ai: true,
    database: true,
    blob: true,
    browser: true,
    kv: true,
    cache: true,
    vectorize: {
      example: {
        metric: 'cosine',
        dimensions: 768,
        metadataIndexes: { name: 'string', price: 'number' }
      }
    },
    bindings: {
      compatibilityDate: '2024-11-18'
      // compatibilityFlags: ['nodejs_compat']
      // Used for /api/hyperdrive
      // hyperdrive: {
      //   POSTGRES: '8bb2913857b84c939cd908740fa5a5d5'
      // }
    }
    // projectUrl: ({ branch }) => branch === 'main' ? 'https://playground.nuxt.dev' : `https://${encodeHost(branch).replace(/\//g, '-')}.playground-to39.pages.dev`
  },
  hooks: {
    'hub:database:migrations:dirs': (dirs) => {
      dirs.push('my-module/database/migrations')
    },
    'hub:database:queries:paths': (queries) => {
      queries.push(resolver.resolve('server/database/queries/admin.sql'))
    }
  },

  basicAuth: {
    enabled: process.env.NODE_ENV === 'production',
    allowedRoutes: ['/api/_hub/'],
    users: [
      {
        username: 'admin',
        password: process.env.NUXT_ADMIN_PASSWORD || 'admin'
      }
    ]
  }
})
