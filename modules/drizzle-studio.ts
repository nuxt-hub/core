import { defineNuxtModule } from 'nuxt/kit'
import { addCustomTab, startSubprocess } from '@nuxt/devtools-kit'

export default defineNuxtModule({
  meta: {
    name: 'drizzle-studio'
  },
  setup (_options, nuxt) {
    if (!nuxt.options.dev) {
      return
    }

    startSubprocess(
      {
        command: 'npx',
        args: ['drizzle-kit', 'studio'],
      },
      {
        id: 'nuxt-drizzle-kit--studio',
        name: 'Drizzle Studio',
      },
    )

    addCustomTab({
      name: 'dizzle-studio',
      title: 'Drizzle Studio',
      icon: 'simple-icons:drizzle',
      view: {
        type: 'iframe',
        src: 'https://local.drizzle.studio'
      }
    })
  }
})
