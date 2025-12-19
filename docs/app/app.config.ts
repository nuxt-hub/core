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
    contentNavigation: {
      slots: {
        linkLeadingIcon: 'size-4',
        listWithChildren: 'ms-4.5'
      }
    },
    prose: {
      codeIcon: {
        deno: 'vscode-icons:file-type-deno',
        auto: 'vscode-icons:file-type-js',
        jsonc: 'i-vscode-icons-file-type-json'
      },
      tabs: {
        slots: {
          root: 'rounded border border-default gap-0'
        }
      },
      tabsItem: {
        base: 'p-4'
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
