import type { ResolvedHubConfig } from '../../../../types'
import { applyDatabaseMigrations, applyDatabaseQueries } from '../utils/migrations/migrations'
// @ts-expect-error - Generated at runtime
import { db } from 'hub:database'
// @ts-expect-error - Generated at runtime
import { defineNitroPlugin, useRuntimeConfig } from '#imports'

export default defineNitroPlugin(async (nitroApp: any) => {
  if (!import.meta.dev) return

  const hub = useRuntimeConfig().hub as ResolvedHubConfig
  if (!hub.database) return

  await applyDatabaseMigrations(hub, db)
  await applyDatabaseQueries(hub, db)

  nitroApp.hooks.callHookParallel('hub:database:migrations:done')
})
