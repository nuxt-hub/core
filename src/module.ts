import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { defu } from 'defu'
import { dirname, join, relative, resolve as resolveFs } from 'pathe'
import { readPackageJSON } from 'pkg-types'
import { provider } from 'std-env'
import { setupCacheNitro } from './cache/setup-nitro'
import { setupDatabaseNitro } from './db/setup-nitro'
import { setupKVNitro } from './kv/setup-nitro'
import { setupBlobNitro } from './blob/setup-nitro'
import { setupCloudflareNitro } from './hosting/cloudflare'
import { resolve } from './utils-nitro'
import type { HubConfig, ResolvedHubConfig } from './types'
import type { Nitro } from 'nitropack/types'

export type { ModuleOptions } from './types'
export * from './types/index'

function resolveRuntimePath(path: string) {
  const candidates = [
    resolve(`${path}.mjs`),
    resolve(`${path}.js`),
    resolve(`${path}.ts`),
    resolve(path)
  ]
  return candidates.find(candidate => existsSync(candidate)) || resolve(path)
}

export default {
  name: '@nuxthub/core',
  async setup(nitro: Nitro) {
    const hosting = process.env.NITRO_PRESET || nitro.options.preset || provider
    const hub = defu(nitro.options.hub, {
      dir: '.data',
      hosting,
      blob: false,
      cache: false,
      db: false,
      kv: false
    }) as HubConfig

    // Minimal mode still compiles routes that `import('hub:*')`.
    // Provide always-resolvable stubs so Cloudflare presets (which disallow externals) can bundle.
    nitro.options.alias ||= {}
    const stubsDir = join(nitro.options.buildDir, 'hub-stubs')
    await mkdir(stubsDir, { recursive: true })
    const disabledStub = (name: string) => `const err = new Error(\`${name} is disabled\`)\n` +
      `const trap = { get() { throw err } }\n` +
      `export default new Proxy({}, trap)\n`
    await writeFile(join(stubsDir, 'blob.mjs'), [
      disabledStub('hub:blob'),
      'export const blob = new Proxy({}, { get() { throw err } })',
      'export function ensureBlob() { throw err }',
      ''
    ].join('\n'), 'utf8')
    await writeFile(join(stubsDir, 'kv.mjs'), [
      disabledStub('hub:kv'),
      'export const kv = new Proxy({}, { get() { throw err } })',
      ''
    ].join('\n'), 'utf8')
    await writeFile(join(stubsDir, 'db.mjs'), [
      disabledStub('hub:db'),
      'export const db = new Proxy({}, { get() { throw err } })',
      'export const schema = {}',
      ''
    ].join('\n'), 'utf8')
    await writeFile(join(stubsDir, 'db-schema.mjs'), [
      disabledStub('hub:db:schema'),
      'export const schema = {}',
      ''
    ].join('\n'), 'utf8')
    nitro.options.alias['hub:blob'] ||= join(stubsDir, 'blob.mjs')
    nitro.options.alias['hub:kv'] ||= join(stubsDir, 'kv.mjs')
    nitro.options.alias['hub:db'] ||= join(stubsDir, 'db.mjs')
    nitro.options.alias['hub:db:schema'] ||= join(stubsDir, 'db-schema.mjs')

    hub.dir = await resolveFs(nitro.options.rootDir, hub.dir)

    await mkdir(hub.dir, { recursive: true })
      .catch((e: any) => {
        if (e.errno !== -17) throw e
      })

    const packageJSON = await readPackageJSON(nitro.options.rootDir)
    const deps = Object.assign({}, packageJSON.dependencies, packageJSON.devDependencies)
    await setupBlobNitro(nitro, hub, deps)
    await setupCacheNitro(nitro, hub, deps)
    await setupDatabaseNitro(nitro, hub, deps)
    await setupKVNitro(nitro, hub, deps)

    nitro.options.runtimeConfig ||= {}
    nitro.options.runtimeConfig.hub = hub as ResolvedHubConfig

    nitro.options.experimental ||= {}
    nitro.options.experimental.asyncContext = true

    if (!nitro.options.dev && hub.hosting.includes('cloudflare')) {
      setupCloudflareNitro(nitro, hub)
      const nodeConsoleShim = resolveRuntimePath('runtime/shims/node-console')
      nitro.options.alias ||= {}
      // Cloudflare's Node.js compat exposes `node:console` with `createTask` that throws.
      // Alias it to a safe shim during bundling.
      nitro.options.alias['node:console'] = nodeConsoleShim
      nitro.options.externals ||= {}
      nitro.options.externals.inline ||= []
      if (!nitro.options.externals.inline.includes('node:console')) {
        nitro.options.externals.inline.push('node:console')
      }
      // Also override unenv's builtin mapping so Nitro's own runtime bundle doesn't keep `node:console`.
      const unenvPresets = (nitro.options as any).unenv
      // `unenvWorkerdWithNodeCompat` marks `node:console` as external; use unenv's `!` negation to remove it.
      const shimAliasPreset = { alias: { 'node:console': nodeConsoleShim }, external: ['!node:console'] }
      if (Array.isArray(unenvPresets)) {
        unenvPresets.push(shimAliasPreset)
      } else if (unenvPresets) {
        ;(nitro.options as any).unenv = [unenvPresets, shimAliasPreset]
      } else {
        ;(nitro.options as any).unenv = [shimAliasPreset]
      }
      nitro.options.plugins ||= []
      nitro.options.plugins.push(resolveRuntimePath('runtime/plugins/console-create-task'))

      nitro.hooks.hook('compiled', async (nitro) => {
        const serverDir = nitro.options.output.serverDir

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
        const shimChunkPath = files.find(f => f.endsWith('/node-console.mjs') || f.endsWith('\\node-console.mjs'))
        if (!shimChunkPath) {
          return
        }

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
    }
  }
}
