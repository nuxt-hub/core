export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate',
      warning: 'amber',
      important: 'violet'
    },
    commandPalette: {
      slots: {
        itemLeadingIcon: 'size-4'
      }
    },
    tabs: {
      slots: {
        list: 'overflow-x-auto'
      }
    }
  },
  uiPro: {
    contentNavigation: {
      slots: {
        linkLeadingIcon: 'size-4',
        listWithChildren: 'ms-4.5'
      }
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
