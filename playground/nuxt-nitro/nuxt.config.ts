import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'pathe'

const isMinimal = process.env.PLAYGROUND_MINIMAL === '1'
const rootDir = dirname(fileURLToPath(import.meta.url))
const resolveFromRoot = (path: string) => resolve(rootDir, path)

export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nuxt-auth-utils'
  ],
  devtools: { enabled: true },
  css: ['~/assets/main.css'],

  routeRules: {
    '/cached': { prerender: true }
  },

  compatibilityDate: '2025-12-11',

  nitro: {
    modules: ['@nuxthub/core/nitro'],
    experimental: {
      websocket: true
    },
    hub: isMinimal
      ? {
          dir: '.data',
          db: false,
          blob: false,
          kv: false,
          cache: false
        }
      : {
          dir: '.data',
          db: 'sqlite',
          blob: true,
          kv: true,
          cache: true
        },
    hooks: isMinimal
      ? {}
      : {
          'hub:db:queries:paths': (queries, dialect) => {
            queries.push(resolveFromRoot(`server/db/queries/admin.${dialect}.sql`))
          }
        }
  }
})
