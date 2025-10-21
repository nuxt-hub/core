import type { Nuxt } from '@nuxt/schema'
import { logger } from '@nuxt/kit'
import type { DatabaseConfig } from './types/module'

const log = logger.withTag('nuxt:hub')

export { setupAI } from './features/ai'
export { setupBase } from './features/base'
export { setupBlob } from './features/blob'
export { setupCache } from './features/cache'
export { setupDatabase, resolveDatabaseConfig } from './features/database'
export { setupKV } from './features/kv'
export { setupOpenAPI } from './features/openapi'

export function logWhenReady(nuxt: Nuxt, message: string, type: 'info' | 'warn' | 'error' = 'info') {
  if (nuxt.options.dev) {
    nuxt.hooks.hookOnce('modules:done', () => {
      log[type](message)
    })
  } else {
    log[type](message)
  }
}

export interface ResolvedDatabaseConfig {
  dialect: 'sqlite' | 'postgresql' | 'mysql'
  driver: string
  connection: Record<string, any>
}

export interface HubConfig {
  ai?: 'vercel' | 'cloudflare'
  blob?: boolean
  cache?: boolean
  database?: boolean | 'postgresql' | 'sqlite' | 'mysql' | DatabaseConfig | ResolvedDatabaseConfig
  kv?: boolean

  dir?: string
  databaseMigrationsDirs?: string[]
  databaseQueriesPaths?: string[]
  applyDatabaseMigrationsDuringBuild?: boolean
}
