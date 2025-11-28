import type { Nuxt } from '@nuxt/schema'
import { logger } from '@nuxt/kit'

const log = logger.withTag('nuxt:hub')

export { setupBase } from './features/base'
export { setupBlob } from './features/blob'
export { setupCache } from './features/cache'
export { setupDatabase, resolveDatabaseConfig } from './features/database'
export { setupKV, resolveKVConfig } from './features/kv'

export function logWhenReady(nuxt: Nuxt, message: string, type: 'info' | 'warn' | 'error' = 'info') {
  if (nuxt.options._prepare) {
    return
  }
  if (nuxt.options.dev) {
    nuxt.hooks.hookOnce('modules:done', () => {
      log[type](message)
    })
  } else {
    log[type](message)
  }
}
