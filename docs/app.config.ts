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
