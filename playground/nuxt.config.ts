// import { encodeHost } from 'ufo'
import module from '../src/module'

export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/mdc',
    '@kgierke/nuxt-basic-auth',
    module
  ],

  hub: {
    ai: true,
    database: true,
    blob: true,
    browser: true,
    kv: true,
    cache: true,
    bindings: {
      // compatibilityFlags: ['nodejs_compat_v2']
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
  },

  compatibilityDate: '2024-08-08'
})
