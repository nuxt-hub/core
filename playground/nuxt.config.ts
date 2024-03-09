export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: [
    '../'
  ],
  modules: [
    '@nuxt/ui',
    '@kgierke/nuxt-basic-auth'
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
