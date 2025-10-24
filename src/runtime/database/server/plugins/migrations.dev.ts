import type { ResolvedHubConfig } from '../../../../types'
import { applyDatabaseMigrations, applyDatabaseQueries } from '../utils/migrations/migrations'
// @ts-expect-error - Generated at runtime
import { drizzle } from 'hub:database'
// @ts-expect-error - Generated at runtime
import { defineNitroPlugin } from '#imports'

export default defineNitroPlugin(async (nitroApp: any) => {
  if (!import.meta.dev) return

  // @ts-expect-error - Nitro global
  const hub = useRuntimeConfig().hub as ResolvedHubConfig
  if (!hub.database) return

  const db = drizzle()
  await applyDatabaseMigrations(hub, db)
  await applyDatabaseQueries(hub, db)

  nitroApp.hooks.callHookParallel('hub:database:migrations:done')
})
