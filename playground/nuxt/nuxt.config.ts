import { createResolver } from '@nuxt/kit'

const resolver = createResolver(import.meta.url)
const isMinimal = process.env.PLAYGROUND_MINIMAL === '1'
const moduleEntry = resolver.resolve('../../src/nuxt/module')

export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
    moduleEntry
  ],
  devtools: { enabled: true },
  css: ['~/assets/main.css'],

  routeRules: {
    '/cached': { prerender: true }
  },

  compatibilityDate: '2025-12-11',

  nitro: {
    // preset: 'cloudflare-module',
    output: process.env.NITRO_PRESET === 'vercel'
      ? { dir: resolver.resolve('.vercel/output') }
      : undefined,
    experimental: {
      websocket: true
    }
  },

  hub: isMinimal
    ? {
        db: false,
        blob: false,
        kv: false,
        cache: false
      }
    : {
        db: 'sqlite',
        blob: true,
        kv: true,
        cache: true
      },
  hooks: isMinimal
    ? {}
    : {
        'hub:db:migrations:dirs': (dirs) => {
          dirs.push('my-module/db/migrations')
        },
        'hub:db:queries:paths': (queries, dialect) => {
          queries.push(resolver.resolve(`server/db/queries/admin.${dialect}.sql`))
        }
      }
})
