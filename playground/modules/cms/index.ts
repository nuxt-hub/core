import { createResolver, defineNuxtModule } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'cms-module'
  },
  setup(_options, nuxt) {
    const { resolve, resolvePath } = createResolver(import.meta.url)

    nuxt.hook('hub:database:migrations:dirs', (dirs) => {
      dirs.push(resolve('db-migrations'))
    })
    nuxt.hook('hub:database:schema:extend', async ({ dialect, paths }) => {
      paths.push(await resolvePath(`./schema/pages.${dialect}`))
    })
  }
})
