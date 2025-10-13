import type { Nuxt } from '@nuxt/schema'
import { logger } from '@nuxt/kit'

const log = logger.withTag('nuxt:hub')

export { setupAI } from './features/ai'
export { setupBase } from './features/base'
export { setupBlob } from './features/blob'
export { setupCache } from './features/cache'
export { setupDatabase } from './features/database'
export { setupKV } from './features/kv'
export { setupOpenAPI } from './features/openapi'

export function logWhenReady(nuxt: Nuxt, message: string, type: 'info' | 'warn' | 'error' = 'info') {
  if (nuxt.options.dev) {
    nuxt.hooks.hookOnce('modules:done', () => {
      log[type](message)
    })
  }
}

export interface HubConfig {
  ai?: 'vercel' | 'cloudflare'
  blob?: boolean
  cache?: boolean
  database?: boolean | 'postgresql' | 'sqlite' | 'mysql'
  kv?: boolean

  dir?: string
  databaseMigrationsDirs?: string[]
  databaseQueriesPaths?: string[]
  applyDatabaseMigrationsDuringBuild?: boolean
}
