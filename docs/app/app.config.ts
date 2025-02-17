export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate',
      warning: 'amber',
      important: 'violet'
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
