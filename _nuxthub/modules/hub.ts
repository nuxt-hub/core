import { defineNuxtModule, createResolver } from 'nuxt/kit'
import { join } from 'pathe'
import { mkdir, writeFile, readFile } from 'node:fs/promises'

export default defineNuxtModule({
  meta: {
    name: 'hub'
  },
  async setup (_options, nuxt) {
    if (!nuxt.options.dev) {
      return
    }

    const { resolve } = createResolver(import.meta.url)

    // Add Server utils based on environment
    // nuxt.options.nitro.imports = nuxt.options.nitro.imports || {}
    // nuxt.options.nitro.imports.dirs = nuxt.options.nitro.imports.dirs || []
    // nuxt.options.nitro.imports.dirs.push(resolve(`../server/_utils/${nuxt.options.dev ? 'dev' : 'prod'}/`))

    // Production mode
    if (!nuxt.options.dev) {
      return
    }
    // Create the .hub/ directory
    try {
      await mkdir(join(nuxt.options.rootDir, './.hub'))
    } catch (e: any) {
      if (e.errno === -17) {
        // File already exists
      } else {
        throw e
      }
    }
    // Add it to .gitignore
    const gitignorePath = join(nuxt.options.rootDir, './.gitignore')
    const gitignore = await readFile(gitignorePath, 'utf-8')
    if (!gitignore.includes('.hub')) {
      await writeFile(gitignorePath, gitignore + '\n.hub', 'utf-8')
    }
  }
})