import { createResolver, defineNuxtModule } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'my-auth-module'
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.hook('hub:database:migrations:dirs', (dirs) => {
      dirs.push(resolve('db-migrations'))
    })
  }
})
