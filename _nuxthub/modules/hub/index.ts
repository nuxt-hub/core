import { defineNuxtModule, createResolver, logger } from 'nuxt/kit'
import { join } from 'pathe'
import { defu } from 'defu'
import { mkdir, writeFile, readFile } from 'node:fs/promises'

export default defineNuxtModule({
  meta: {
    name: 'hub'
  },
  async setup (_options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    // Production mode
    if (!nuxt.options.dev) {
      return
    }

    if (process.env.NUXT_HUB_URL) {
      // TODO: check on hub.nuxt.com if the project is connected
      logger.info(`Using remote hub from \`${process.env.NUXT_HUB_URL}\``)
      return
    } else {
      logger.info('Using local hub from bindings')
    }

    // Local development without remote connection
    // Create the .hub/ directory
    const hubDir = join(nuxt.options.rootDir, './.hub')
    try {
      await mkdir(hubDir)
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

    // Generate the wrangler.toml file
    const wranglerPath = join(hubDir, './wrangler.toml')
    await writeFile(wranglerPath, DEFAULT_WRANGLER, 'utf-8')
    nuxt.options.runtimeConfig.wrangler = defu(nuxt.options.runtimeConfig.wrangler, {
      configPath: wranglerPath,
      persistDir: hubDir
    })
    // Add server plugin
    nuxt.options.nitro.plugins = nuxt.options.nitro.plugins || []
    nuxt.options.nitro.plugins.push(resolve('./runtime/server/plugins/cloudflare.dev'))
  }
})

const DEFAULT_WRANGLER = `d1_databases = [
  { binding = "DB", database_name = "default", database_id = "default" },
]
kv_namespaces = [
  { binding = "KV", id = "user_default" },
  { binding = "CONFIG", id = "config_default" },
]
r2_buckets = [
  { binding = "BLOB", bucket_name = "default" },
]`
