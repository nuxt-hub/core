import type { NitroApp } from 'nitropack/types'
import { applyDatabaseMigrations, applyDatabaseQueries } from '../utils/migrations/migrations'
import { useRuntimeConfig, defineNitroPlugin, useDatabase } from '#imports'

export default defineNitroPlugin(async (nitroApp: NitroApp) => {
  if (!import.meta.dev) return

  const hub = useRuntimeConfig().hub
  if (!hub.database) return

  const db = useDatabase('db')
  await applyDatabaseMigrations(hub, db)
  await applyDatabaseQueries(hub, db)

  nitroApp.hooks.callHookParallel('hub:database:migrations:done')
})
