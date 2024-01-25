import { join } from 'pathe'
import { mkdir } from 'node:fs/promises'

export default defineNuxtConfig({
  modules: [
    async function (options, nuxt) {
      if (!nuxt.options.dev) return
      try {
        await mkdir(join(process.cwd(), './.hub'))
      } catch (e: any) {
        if (e.errno === -17) {
          // File already exists
        } else {
          throw e
        }
      }
    }
  ]
})