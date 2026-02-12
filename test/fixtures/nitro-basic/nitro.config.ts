import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'pathe'
import { defineNitroConfig } from 'nitropack/config'

const rootDir = dirname(fileURLToPath(import.meta.url))
const moduleEntry = resolve(rootDir, '../../../src/nitro/module')

export default defineNitroConfig({
  srcDir: 'server',
  compatibilityDate: '2025-12-11',
  modules: [moduleEntry],
  hub: {
    dir: '.data',
    kv: true
  }
})
