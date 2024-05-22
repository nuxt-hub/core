// import { encodeHost } from 'ufo'
import module from '../src/module'

export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@kgierke/nuxt-basic-auth',
    module
  ],
  hub: {
    database: true,
    kv: true,
    blob: true,
    cache: true
    // projectUrl: ({ branch }) => branch === 'main' ? 'https://playground.nuxt.dev' : `https://${encodeHost(branch).replace(/\//g, '-')}.playground-to39.pages.dev`
  },
  ui: {
    icons: ['heroicons', 'simple-icons']
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
