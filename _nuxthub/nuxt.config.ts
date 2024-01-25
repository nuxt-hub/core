import { join } from 'pathe'
import { mkdir } from 'node:fs/promises'

export default defineNuxtConfig({
  modules: [
    async function (options, nuxt) {
      if (!nuxt.options.dev) return
      await mkdir(join(process.cwd(), './.hub'))
    }
  ]  
})