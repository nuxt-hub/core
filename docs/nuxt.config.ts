import yaml from '@rollup/plugin-yaml'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui-pro',
    '@nuxt/fonts',
    '@nuxt/content',
    '@vueuse/nuxt',
    'nuxt-og-image',
    'nuxt-cloudflare-analytics',
    '@nuxtjs/plausible',
    '@nuxt/image',
    '@nuxt/scripts'
  ],
  devtools: {
    enabled: true
  },
  css: ['~/assets/main.css'],
  content: {
    build: {
      markdown: {
        highlight: {
          langs: ['sql']
        }
      }
    }
  },
  routeRules: {
    '/': { prerender: true },
    '/api/search.json': { prerender: true },
    '/api/templates.json': { prerender: true },
    '/api/changelog.json': { prerender: true },
    '/blog/rss.xml': { prerender: true },
    '/changelog/rss.xml': { prerender: true },
    // Redirects
    '/docs/storage/blob': { redirect: { statusCode: 301, to: '/docs/features/blob' } },
    '/docs/storage/database': { redirect: { statusCode: 301, to: '/docs/features/database' } },
    '/docs/storage/kv': { redirect: { statusCode: 301, to: '/docs/features/kv' } },
    '/docs/server/api': { redirect: { statusCode: 301, to: '/docs/features/open-api' } },
    '/docs/server/cache': { redirect: { statusCode: 301, to: '/docs/features/cache' } },
    '/docs/server/logs': { redirect: { statusCode: 301, to: '/docs/getting-started/server-logs' } }
  },
  future: {
    compatibilityVersion: 4
  },
  compatibilityDate: '2025-02-11',
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      // For CF trailing slash issue
      autoSubfolderIndex: false
    }
  },
  vite: {
    plugins: [
      yaml()
    ]
  },
  typescript: {
    strict: false
  },
  cloudflareAnalytics: {
    token: '469b1f7049f14941acef0d0262a07ab3',
    scriptPath: false
  }
})
