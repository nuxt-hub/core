export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '../src/module',
    '@nuxt/ui',
    '@kgierke/nuxt-basic-auth'
  ],
  ui: {
    icons: ['heroicons', 'simple-icons']
  },
  // hub: {
  //   remote: true
  // },
  basicAuth: {
    enabled: process.env.NODE_ENV === 'production',
    users: [
      {
        username: 'admin',
        password: process.env.NUXT_ADMIN_PASSWORD || 'admin'
      }
    ]
  }
})
