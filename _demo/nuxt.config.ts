export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: [
    '..'
  ],
  modules: [
    '@nuxt/ui'
  ],
  ui: {
    icons: ['heroicons', 'simple-icons']
  }
})
