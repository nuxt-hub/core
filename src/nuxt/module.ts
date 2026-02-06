import { writeFile, readFile, mkdir, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { defineNuxtModule, logger, addTemplate } from '@nuxt/kit'
import { dirname, join, relative, resolve as resolveFs } from 'pathe'
import { defu } from 'defu'
import { findWorkspaceDir, readPackageJSON } from 'pkg-types'
import { provider } from 'std-env'
import { version } from '../../package.json'
import { setupCache } from '../cache/setup'
import { setupDatabase } from '../db/setup'
import { setupKV } from '../kv/setup'
import { setupBlob } from '../blob/setup'
import type { ModuleOptions, HubConfig, ResolvedHubConfig } from '@nuxthub/core'
import { addDevToolsCustomTabs } from '../devtools'
import { setupCloudflare } from '../hosting/cloudflare'
import type { NuxtModule } from '@nuxt/schema'
import { resolve } from '../utils'

const log = logger.withTag('nuxt:hub')

function resolveRuntimePath(path: string) {
  const candidates = [
    resolve(`${path}.mjs`),
    resolve(`${path}.js`),
    resolve(`${path}.ts`),
    resolve(path)
  ]
  return candidates.find(candidate => existsSync(candidate)) || resolve(path)
}

export * from '../types/index'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@nuxthub/core',
    configKey: 'hub',
    version,
    docs: 'https://hub.nuxt.com'
  },
  defaults: {},
  async setup(options, nuxt) {
    // Cannot be used with `nuxt generate`
    if (nuxt.options.nitro.static || (nuxt.options as any)._generate) {
      log.error('NuxtHub is not compatible with `nuxt generate` as it needs a server to run.')
      log.info('To pre-render all pages: `https://hub.nuxt.com/docs/recipes/pre-rendering#pre-render-all-pages`')
      return process.exit(1)
    }

    const rootDir = nuxt.options.rootDir
    const hosting = process.env.NITRO_PRESET || nuxt.options.nitro.preset || provider
    const hub = defu(options, {
      // Local storage
      dir: '.data',
      hosting,
      // NuxtHub features
      blob: false,
      cache: false,
      db: false,
      kv: false
    }) as HubConfig
    // resolve the hub directory
    hub.dir = await resolveFs(nuxt.options.rootDir, hub.dir)

    // Create the hub directory
    await mkdir(hub.dir, { recursive: true })
      .catch((e: any) => {
        if (e.errno !== -17) throw e
      })

    const packageJSON = await readPackageJSON(nuxt.options.rootDir)
    const deps = Object.assign({}, packageJSON.dependencies, packageJSON.devDependencies)
    await setupBlob(nuxt, hub as HubConfig, deps)
    await setupCache(nuxt, hub as HubConfig, deps)
    await setupDatabase(nuxt, hub as HubConfig, deps)
    await setupKV(nuxt, hub as HubConfig, deps)

    const runtimeConfig = nuxt.options.runtimeConfig
    runtimeConfig.hub = hub as ResolvedHubConfig
    runtimeConfig.public.hub ||= {}
    if (nuxt.options._prepare) {
      addTemplate({
        filename: 'hub/db/config.json',
        write: true,
        getContents: () => JSON.stringify(hub, null, 2)
      })
    }

    // nuxt prepare, stop here
    if (nuxt.options._prepare) {
      return
    }

    // Add custom tabs to Nuxt DevTools
    if (nuxt.options.dev) {
      addDevToolsCustomTabs(nuxt, hub)
    }

    // Enable Async Local Storage
    nuxt.options.nitro.experimental = nuxt.options.nitro.experimental || {}
    nuxt.options.nitro.experimental.asyncContext = true

    if (!nuxt.options.dev && hub.hosting.includes('cloudflare')) {
      setupCloudflare(nuxt, hub)
      const nodeConsoleShim = resolveRuntimePath('runtime/shims/node-console')
      nuxt.options.nitro.alias ||= {}
      // Cloudflare's Node.js compat exposes `node:console` with `createTask` that throws.
      // Alias it to a safe shim during bundling.
      nuxt.options.nitro.alias['node:console'] = nodeConsoleShim
      nuxt.options.nitro.externals ||= {}
      nuxt.options.nitro.externals.inline ||= []
      if (!nuxt.options.nitro.externals.inline.includes('node:console')) {
        nuxt.options.nitro.externals.inline.push('node:console')
      }
      // Also override unenv's builtin mapping so Nitro's own runtime bundle doesn't keep `node:console`.
      const unenvPresets = nuxt.options.nitro.unenv
      // `unenvWorkerdWithNodeCompat` marks `node:console` as external; use unenv's `!` negation to remove it.
      const shimAliasPreset = { alias: { 'node:console': nodeConsoleShim }, external: ['!node:console'] }
      if (Array.isArray(unenvPresets)) {
        unenvPresets.push(shimAliasPreset as any)
      } else if (unenvPresets) {
        nuxt.options.nitro.unenv = [unenvPresets as any, shimAliasPreset as any]
      } else {
        nuxt.options.nitro.unenv = [shimAliasPreset as any]
      }
      nuxt.options.nitro.plugins ||= []
      nuxt.options.nitro.plugins.push(resolveRuntimePath('runtime/plugins/console-create-task'))

      // Nuxt applies Nitro presets after modules have run, which can overwrite `nitro.unenv`.
      // Apply the `!node:console` external override at the Nitro config hook stage as well.
      nuxt.hook('nitro:config', (nitroConfig) => {
        nitroConfig.alias ||= {}
        nitroConfig.alias['node:console'] = nodeConsoleShim
        // Nitro's Cloudflare node-compat preset may inline a shim that imports `#workerd/node:console`.
        // Alias that too so we never touch Cloudflare's throwing `createTask`.
        nitroConfig.alias['#workerd/node:console'] = nodeConsoleShim
        const presets = Array.isArray(nitroConfig.unenv)
          ? nitroConfig.unenv
          : nitroConfig.unenv
            ? [nitroConfig.unenv as any]
            : []
        presets.push({ external: ['!node:console'] } as any)
        nitroConfig.unenv = presets as any
      })

      // Build output patch: Nitro's Cloudflare presets can still externalize `node:console`,
      // which keeps Cloudflare's throwing `createTask` alive in the runtime bundle.
      // Patch the compiled output to import our safe shim instead.
      nuxt.hook('nitro:init', (nitro) => {
        if (nitro.options.dev || !nitro.options.preset?.includes('cloudflare')) {
          return
        }
        nitro.hooks.hook('compiled', async (nitro) => {
          const serverDir = nitro.options.output.serverDir
          const shimChunkPath = join(serverDir, 'chunks/_/node-console.mjs')
          if (!existsSync(shimChunkPath)) {
            return
          }

          async function walk(dir: string): Promise<string[]> {
            const entries = await readdir(dir, { withFileTypes: true })
            const out: string[] = []
            for (const ent of entries) {
              const p = join(dir, ent.name)
              if (ent.isDirectory()) {
                out.push(...await walk(p))
              } else {
                out.push(p)
              }
            }
            return out
          }

          const files = await walk(serverDir)
          await Promise.all(files.map(async (file) => {
            if (file === shimChunkPath) {
              return
            }
            if (!file.endsWith('.mjs') && !file.endsWith('.js')) {
              return
            }
            let contents = await readFile(file, 'utf-8')
            if (!contents.includes('node:console') && !contents.includes('#workerd/node:console')) {
              return
            }
            const relToShimRaw = relative(dirname(file), shimChunkPath)
            const relToShim = relToShimRaw.startsWith('.') ? relToShimRaw : `./${relToShimRaw}`

            const patched = contents
              .replace(/(["'])node:console\1/g, `$1${relToShim}$1`)
              .replace(/(["'])#workerd\/node:console\1/g, `$1${relToShim}$1`)
            if (patched !== contents) {
              await writeFile(file, patched, 'utf-8')
            }
          }))
        })
      })
    }

    // Add .data to .gitignore
    if (nuxt.options.dev) {
      const workspaceDir = await findWorkspaceDir(rootDir)
      // Add it to .gitignore
      const gitignorePath = join(workspaceDir, '.gitignore')
      const gitignore = await readFile(gitignorePath, 'utf-8').catch(() => '')
      const relativeDir = relative(workspaceDir, hub.dir)
      if (!gitignore.includes(relativeDir)) {
        await writeFile(gitignorePath, `${gitignore ? gitignore + '\n' : gitignore}${relativeDir}`, 'utf-8')
      }
    }
  }
}) as NuxtModule<ModuleOptions>
