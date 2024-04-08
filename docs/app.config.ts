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
    siteName: 'NuxtHub',
  },
  toc: {
    title: 'Table of Contents',
    bottom: {
      title: 'Community',
      edit: 'https://github.com/nuxt-hub/core/edit/main/docs/content',
      links: [{
        icon: 'i-heroicons-star',
        label: 'Star on GitHub',
        to: 'https://github.com/nuxt-hub/core',
        target: '_blank',
      }, {
        icon: 'i-simple-icons-nuxtdotjs',
        label: 'NuxtHub Admin',
        to: 'https://admin.hub.nuxt.com',
        target: '_blank',
      }]
    }
  }
})
