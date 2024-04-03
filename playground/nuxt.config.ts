import module from '../src/module'

export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@kgierke/nuxt-basic-auth',
    module
  ],
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
