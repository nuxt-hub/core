export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '../src/module',
    '@nuxt/ui'
  ],
  ui: {
    icons: ['heroicons', 'simple-icons']
  },
  hub: {
    // local: true
  }
})
