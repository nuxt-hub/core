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
    },

    storage: {
      kv: {
        driver: 'redis',
        base: 'unstorage',
        host: 'HOSTNAME',
        tls: true as any,
        port: 6380,
        password: 'REDIS_PASSWORD'
      },
      blob: {
        driver: 'fs',
        base: '.data/blob'
      },
      cache: {
        driver: 'fs',
        base: '.data/cache'
      }
    }

    // Production database configuration
    // Not necessary if hub.database is set to a specific dialect
    // database: {
    //   db: {
    //     connector: 'better-sqlite3'
    //   }
    // },
    // Override local development database configuration
    // By default it's automatically configured based on set hub.database dialect or production database connector
    // devDatabase: {
    //   db: {
    //     connector: 'better-sqlite3'
    //   }
    // }
  },

  hub: {
    database: 'sqlite',
    blob: true,
    kv: true,
    cache: true
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
