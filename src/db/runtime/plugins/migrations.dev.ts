import type { ResolvedHubConfig } from '../../../types'
import { applyDatabaseMigrations, applyDatabaseQueries } from '../../lib/migrations'
// @ts-expect-error - Generated at runtime
import { db } from 'hub:db'
import { defineNitroPlugin, useRuntimeConfig } from '#imports'

export default defineNitroPlugin(async () => {
  if (!import.meta.dev) return

  const hub = useRuntimeConfig().hub as ResolvedHubConfig
  if (!hub.db) return

  await applyDatabaseMigrations(hub, db)
  await applyDatabaseQueries(hub, db)
})
