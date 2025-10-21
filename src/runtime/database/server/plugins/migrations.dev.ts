import { applyDatabaseMigrations, applyDatabaseQueries } from '../utils/migrations/migrations'
// @ts-expect-error - Generated at runtime
import { drizzle } from 'hub:database'

// @ts-expect-error - Nitro global
export default defineNitroPlugin(async (nitroApp: any) => {
  if (!import.meta.dev) return

  // @ts-expect-error - Nitro global
  const hub = useRuntimeConfig().hub
  if (!hub.database) return

  const dbConfig = hub.database
  if (!dbConfig || typeof dbConfig === 'boolean' || typeof dbConfig === 'string') {
    console.error('Database configuration not resolved properly')
    return
  }

  const db = drizzle()
  await applyDatabaseMigrations(hub, db, dbConfig.dialect)
  await applyDatabaseQueries(hub, db, dbConfig.dialect)

  nitroApp.hooks.callHookParallel('hub:database:migrations:done')
})
