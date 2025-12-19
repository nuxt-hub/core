import type { ResolvedHubConfig } from '../../../types'
import { applyDatabaseMigrations, applyDatabaseQueries } from '../../lib/migrations'
import { defineNitroPlugin, useRuntimeConfig } from '#imports'

export default defineNitroPlugin(async () => {
  if (!import.meta.dev) return

  const hub = useRuntimeConfig().hub as ResolvedHubConfig
  if (!hub.db) return

  // Wait for nitro-cloudflare-dev bindings if present (sets globalThis.__env__ as Promise initially)
  if (globalThis.__env__ && typeof globalThis.__env__.then === 'function') {
    await globalThis.__env__
  }

  // @ts-expect-error - Generated at runtime
  const { db } = await import('hub:db')
  await applyDatabaseMigrations(hub, db)
  await applyDatabaseQueries(hub, db)
})
