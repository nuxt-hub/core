import type { ResolvedHubConfig } from '../../../types'
import { applyDatabaseMigrations, applyDatabaseQueries } from '../../lib/migrations'
import { defineNitroPlugin, useRuntimeConfig } from '#imports'

export default defineNitroPlugin(async () => {
  if (!import.meta.dev) return

  const hub = useRuntimeConfig().hub as ResolvedHubConfig
  if (!hub.db) return

  let executeRaw, getRows
  try {
    const module = await import('hub:db')
    executeRaw = module.executeRaw
    getRows = module.getRows
  } catch (error) {
    console.error('[nuxt:hub] Failed to import hub:db module:', error instanceof Error ? error.message : error)
    console.error('[nuxt:hub] This may happen when using remote bindings before the proxy is initialized.')
    console.error('[nuxt:hub] Migrations will be skipped. Please ensure remote bindings are properly configured.')
    return
  }

  await applyDatabaseMigrations(hub, { executeRaw, getRows })
  await applyDatabaseQueries(hub, { executeRaw })
})
