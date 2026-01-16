import type { ResolvedHubConfig } from '../../../types'
import { applyDatabaseMigrations, applyDatabaseQueries } from '../../lib/migrations'
import { defineNitroPlugin, useRuntimeConfig } from '#imports'

export default defineNitroPlugin(async () => {
  if (!import.meta.dev) return

  const hub = useRuntimeConfig().hub as ResolvedHubConfig
  if (!hub.db) return

  let db
  try {
    // @ts-expect-error - Generated at runtime
    const module = await import('hub:db')
    db = module.db
  } catch (error: any) {
    console.error('[nuxt:hub] Failed to import hub:db module')
    console.error('[nuxt:hub] This may happen if database bindings are not ready yet.')
    if (hub._remote) {
      console.error('[nuxt:hub] In remote mode, ensure wrangler is logged in and binding IDs are correct.')
    }
    console.error('[nuxt:hub] Error:', error.message || error)
    return
  }

  await applyDatabaseMigrations(hub, db)
  await applyDatabaseQueries(hub, db)
})
