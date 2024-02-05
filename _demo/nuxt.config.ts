export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: [
    '..'
  ],
  modules: [
    '@nuxt/ui',
    'nuxt-auth-utils'
  ],
  ui: {
    icons: ['heroicons', 'simple-icons']
  }
})
