import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'pathe'
import { defineNitroConfig } from 'nitropack/config'

const isMinimal = process.env.PLAYGROUND_MINIMAL === '1'
const moduleEntry = process.env.VERCEL
  ? '@nuxthub/core/nitro'
  : resolve(dirname(fileURLToPath(import.meta.url)), '../../src/nitro/module')

export default defineNitroConfig({
  srcDir: 'server',
  compatibilityDate: '2025-12-11',
  modules: [moduleEntry],
  hub: isMinimal
    ? {
        db: false,
        blob: false,
        kv: false,
        cache: false
      }
    : {
        db: 'sqlite',
        blob: true,
        kv: true,
        cache: true
      },
  runtimeConfig: {
    public: {
      playground: {
        runtime: 'nitro'
      }
    }
  }
})
