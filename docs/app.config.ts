export default defineAppConfig({
  ui: {
    primary: 'green',
    gray: 'slate',
    variables: {
      dark: {
        background: 'var(--color-gray-950)'
      }
    },
    header: {
      wrapper: 'lg:mb-0 border-0'
    },
    icons: {
      dark: 'i-lucide-moon',
      light: 'i-lucide-sun',
      system: 'i-lucide-screen',
      search: 'i-lucide-search',
      external: 'i-lucide-arrow-up-right',
      chevron: 'i-lucide-chevron-down',
      hash: 'i-lucide-hash',
      menu: 'i-lucide-menu',
      close: 'i-lucide-x',
      check: 'i-lucide-circle-check'
    }
  },
  seo: {
    siteName: 'NuxtHub'
  },
  toc: {
    title: 'On this page',
    bottom: {
      edit: 'https://github.com/nuxt-hub/core/edit/main/docs/content'
    }
  }
})
