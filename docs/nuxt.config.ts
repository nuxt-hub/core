// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxt/image',
    '@nuxt/scripts',
    '@vueuse/nuxt',
    'nuxt-og-image',
    'nuxt-llms'
  ],

  $production: {
    scripts: {
      registry: {
        cloudflareWebAnalytics: {
          token: '469b1f7049f14941acef0d0262a07ab3'
        },
        plausibleAnalytics: {
          domain: 'hub.nuxt.com'
        }
      }
    }
  },
  devtools: {
    enabled: true
  },
  css: ['~/assets/main.css'],
  content: {
    build: {
      markdown: {
        highlight: {
          langs: ['bash', 'diff', 'json', 'js', 'ts', 'html', 'css', 'vue', 'shell', 'mdc', 'md', 'yaml', 'sql']
        },
        remarkPlugins: {
          'remark-mdc': {
            options: {
              autoUnwrap: true
            }
          }
        }
      }
    },
    experimental: { sqliteConnector: 'native' }
  },
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'info', 'success', 'warning', 'error', 'important']
    }
  },
  routeRules: {
    '/': { prerender: true },
    '/api/templates.json': { prerender: true },
    '/api/changelog.json': { prerender: true },
    '/changelog/rss.xml': { prerender: true },
    // Redirects
    '/docs/getting-started/remote-storage': { redirect: { statusCode: 301, to: '/' } },
    '/docs/features': { redirect: { statusCode: 301, to: '/docs/features/blob' } },
    '/docs/features/realtime': { redirect: { statusCode: 301, to: '/docs/guides/realtime' } },
    '/docs/recipes': { redirect: { statusCode: 301, to: '/docs/guides/pre-rendering' } },
    '/docs/storage/blob': { redirect: { statusCode: 301, to: '/docs/features/blob' } },
    '/docs/storage/database': { redirect: { statusCode: 301, to: '/docs/features/database' } },
    '/docs/storage/kv': { redirect: { statusCode: 301, to: '/docs/features/kv' } },
    '/docs/server/api': { redirect: { statusCode: 301, to: '/docs/features/open-api' } },
    '/docs/server/cache': { redirect: { statusCode: 301, to: '/docs/features/cache' } },
    '/docs/server/logs': { redirect: { statusCode: 301, to: '/docs/getting-started/server-logs' } },
    // Recipes
    '/docs/recipes/hooks': { redirect: { statusCode: 301, to: '/docs/guides/hooks' } },
    '/docs/recipes/drizzle': { redirect: { statusCode: 301, to: '/docs/features/database' } },
    '/docs/guides/drizzle': { redirect: { statusCode: 301, to: '/docs/features/database' } },
    '/docs/recipes/pre-rendering': { redirect: { statusCode: 301, to: '/docs/guides/pre-rendering' } }
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
  typescript: {
    strict: false
  },
  llms: {
    domain: 'https://hub.nuxt.com',
    title: 'NuxtHub Documentation for LLMs',
    description: 'NuxtHub helps you build and deploy full-stack Nuxt applications globally on your Cloudflare account.',
    full: {
      title: 'NuxtHub Complete Documentation',
      description: 'The complete NuxtHub documentation, blog posts and changelog written in Markdown (MDC syntax).'
    }
  }
})
