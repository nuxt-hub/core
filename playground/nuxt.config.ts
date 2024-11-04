// import { encodeHost } from 'ufo'
import module from '../src/module'

export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxtjs/mdc',
    '@kgierke/nuxt-basic-auth',
    module
  ],
  devtools: { enabled: true },

  routeRules: {
    '/cached': { prerender: true }
  },
  future: { compatibilityVersion: 4 },

  // nitro: {
  //   cloudflare: {
  //     wrangler: {
  //       compatibility_flags: ['nodejs_compat_v2']
  //     }
  //   }
  // },

  compatibilityDate: '2024-08-08',

  nitro: {
    experimental: {
      openAPI: true
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
      compatibilityDate: '2024-10-02',
      compatibilityFlags: ['nodejs_compat']
      // Used for /api/hyperdrive
      // hyperdrive: {
      //   POSTGRES: '8bb2913857b84c939cd908740fa5a5d5'
      // }
    }
    // projectUrl: ({ branch }) => branch === 'main' ? 'https://playground.nuxt.dev' : `https://${encodeHost(branch).replace(/\//g, '-')}.playground-to39.pages.dev`
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
