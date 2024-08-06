// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-08-06',
  extends: ['@nuxt/ui-pro'],
  modules: [
    '@nuxt/fonts',
    '@nuxt/content',
    '@vueuse/nuxt',
    '@nuxt/ui',
    '@nuxthq/studio',
    'nuxt-og-image',
    'nuxt-cloudflare-analytics',
    '@nuxtjs/plausible',
    '@nuxt/image'
  ],
  hooks: {
    // Define `@nuxt/ui` components as global to use them in `.md` (feel free to add those you need)
    'components:extend': (components) => {
      const globals = components.filter(c => ['UButton', 'UIcon'].includes(c.pascalName))

      globals.forEach(c => c.global = true)
    }
  },
  routeRules: {
    '/': { prerender: true },
    '/api/search.json': { prerender: true },
    '/api/templates.json': { prerender: true },
    // Redirects
    '/docs/storage/blob': { redirect: { statusCode: 301, to: '/docs/features/blob' } },
    '/docs/storage/database': { redirect: { statusCode: 301, to: '/docs/features/database' } },
    '/docs/storage/kv': { redirect: { statusCode: 301, to: '/docs/features/kv' } },
    '/docs/server/api': { redirect: { statusCode: 301, to: '/docs/features/api' } },
    '/docs/server/cache': { redirect: { statusCode: 301, to: '/docs/features/cache' } },
    '/docs/server/logs': { redirect: { statusCode: 301, to: '/docs/getting-started/server-logs' } }
  },
  nitro: {
    prerender: {
      // For CF trailing slash issue
      autoSubfolderIndex: false
    }
  },
  cloudflareAnalytics: {
    token: '469b1f7049f14941acef0d0262a07ab3',
    scriptPath: false
  },
  devtools: {
    enabled: true
  },
  typescript: {
    strict: false
  }
})
