export default defineAppConfig({
  ui: {
    primary: 'green',
    gray: 'slate',
    variables: {
      dark: {
        background: 'var(--color-gray-950)'
      }
    }
  },
  seo: {
    siteName: 'NuxtHub'
  },
  toc: {
    title: 'Table of Contents',
    bottom: {
      edit: 'https://github.com/nuxt-hub/core/edit/main/docs/content'
    }
  }
})
