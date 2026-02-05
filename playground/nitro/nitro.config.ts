import { defineNitroConfig } from 'nitropack/config'
import module from '../../src/module'

const isMinimal = process.env.PLAYGROUND_MINIMAL === '1'

export default defineNitroConfig({
  srcDir: 'server',
  compatibilityDate: '2025-12-11',
  modules: [module],
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
