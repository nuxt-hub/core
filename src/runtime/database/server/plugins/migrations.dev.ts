import type { NitroApp } from 'nitropack/types'
import { applyDatabaseMigrations, applyDatabaseQueries } from '../utils/migrations/migrations'
import { useRuntimeConfig, defineNitroPlugin } from '#imports'

export default defineNitroPlugin(async (nitroApp: NitroApp) => {
  if (!import.meta.dev) return

  const hub = useRuntimeConfig().hub
  if (!hub.database) return

  await applyDatabaseMigrations(hub)
  await applyDatabaseQueries(hub)

  nitroApp.hooks.callHookParallel('hub:database:migrations:done')
})
