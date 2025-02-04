import { applyRemoteDatabaseMigrations, applyRemoteDatabaseQueries } from '../utils/migrations/remote'
import { hubHooks } from '../../../base/server/utils/hooks'
import { applyDatabaseMigrations, applyDatabaseQueries } from '../utils/migrations/migrations'
import { useRuntimeConfig, defineNitroPlugin } from '#imports'

export default defineNitroPlugin(async () => {
  if (!import.meta.dev) return

  const hub = useRuntimeConfig().hub
  if (!hub.database) return

  hubHooks.hookOnce('bindings:ready', async () => {
    if (hub.remote && hub.projectKey) { // linked to a NuxtHub project
      await applyRemoteDatabaseMigrations(hub)
      await applyRemoteDatabaseQueries(hub)
    } else { // local dev & self hosted
      await applyDatabaseMigrations(hub)
      await applyDatabaseQueries(hub)
    }

    await hubHooks.callHookParallel('database:migrations:done')
  })
})
