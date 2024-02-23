export default defineAppConfig({
  ui: {
    primary: 'emerald',
    gray: 'cool',
    footer: {
      bottom: {
        left: 'text-sm text-gray-500 dark:text-gray-400',
        wrapper: 'border-t border-gray-200 dark:border-gray-800'
      }
    }
  },
  seo: {
    siteName: 'NuxtHub',
  },
  header: {
    logo: {
      alt: '',
      light: '',
      dark: ''
    },
    search: true,
    colorMode: true,
    links: [{
      icon: 'i-simple-icons-github',
      to: 'https://github.com/nuxt-hub/core',
      target: '_blank',
      'aria-label': 'NuxtHub'
    }]
  },
  footer: {
    credits: 'Copyright © 2024',
    colorMode: false,
    links: [{
      icon: 'i-simple-icons-nuxtdotjs',
      to: 'https://nuxt.com',
      target: '_blank',
      'aria-label': 'Nuxt Website'
    }, {
      icon: 'i-simple-icons-x',
      to: 'https://x.com/nuxt_js',
      target: '_blank',
      'aria-label': 'Nuxt on X'
    }, {
      icon: 'i-simple-icons-github',
      to: 'https://github.com/nuxt-hub/core',
      target: '_blank',
      'aria-label': 'NuxtHub on GitHub'
    }]
  },
  toc: {
    title: 'Table of Contents',
    bottom: {
      title: 'Community',
      edit: 'https://github.com/nuxt-hub/core/edit/main/content',
      links: [{
        icon: 'i-heroicons-star',
        label: 'Star on GitHub',
        to: 'https://github.com/nuxt-hub/core',
        target: '_blank',
      }, {
        icon: 'i-simple-icons-nuxtdotjs',
        label: 'NuxtHub Console',
        to: 'https://hub.nuxt.com',
        target: '_blank',
      }]
    }
  }
})
