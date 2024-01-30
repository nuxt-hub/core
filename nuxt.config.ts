export default defineNuxtConfig({
  devtools: { enabled: true },
  // extends: '@nuxt/ui-pro',
  extends: [
    // '/Users/atinux/Projects/nuxt/ui-pro',
    './_nuxthub'
  ],
  modules: [
    '@nuxt/ui',
    'nuxt-auth-utils'
  ],
  ui: {
    icons: ['heroicons', 'simple-icons']
  }
})
