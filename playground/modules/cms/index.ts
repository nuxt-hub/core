import { createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url)
    nuxt.hook('hub:db:schema:extend', ({ dialect, paths }) => {
      paths.push(resolver.resolve(`./db/schema/pages.${dialect}.ts`))
    })
  }
})
