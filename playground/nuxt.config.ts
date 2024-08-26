// import { encodeHost } from 'ufo'
import module from '../src/module'

export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@kgierke/nuxt-basic-auth',
    module
  ],

  hub: {
    ai: true,
    database: true,
    kv: true,
    blob: true,
    cache: true,
    bindings: {
      // Used for /api/hyperdrive
      hyperdrive: {
        HYPERDRIVE: '08f7bc805d1d409aac17e72af502abd0'
      }
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
