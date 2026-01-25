import { join } from 'pathe'
import { logger } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import type { HubConfig, ResolvedDatabaseConfig } from '@nuxthub/core'
import { getPort } from 'get-port-please'

let isReady = false
let promise: Promise<any> | null = null
let port = 4983

const log = logger.withTag('nuxt:hub')

async function launchDrizzleStudio(nuxt: Nuxt, hub: HubConfig) {
  const dbConfig = hub.db as ResolvedDatabaseConfig
  if (!dbConfig || typeof dbConfig === 'boolean' || typeof dbConfig === 'string') {
    throw new Error('Database configuration not resolved properly. Please ensure database is configured in hub.db')
  }

  port = await getPort({ port: 4983 })

  try {
    const { dialect, driver, connection } = dbConfig
    const schemaPath = join(nuxt.options.rootDir, 'node_modules', '@nuxthub', 'db', 'db.mjs')
    const { schema } = await import(schemaPath)

    // Launch Drizzle Studio based on dialect and driver
    // Some drivers require launching from within Nitro (where the binding/client lives)
    const nitroDevUrl = `${nuxt.options.devServer.https ? 'https' : 'http'}://localhost:${nuxt.options.devServer.port || 3000}`

    if (dialect === 'postgresql') {
      if (driver === 'pglite') {
        log.info(`Launching Drizzle Studio with PGlite...`)

        // Trigger studio launch in the Nitro process for PGlite instance
        await fetch(`${nitroDevUrl}/api/_hub/db/launch-studio?port=${port}&driver=pglite`, {
          method: 'POST'
        })
      } else {
        const { startStudioPostgresServer } = await import('drizzle-kit/api')
        // For postgres-js and other PostgreSQL drivers
        log.info(`Launching Drizzle Studio with PostgreSQL...`)
        await startStudioPostgresServer(schema, connection, { port })
      }
    } else if (dialect === 'mysql') {
      const { startStudioMySQLServer } = await import('drizzle-kit/api')
      log.info(`Launching Drizzle Studio with MySQL...`)
      await startStudioMySQLServer(schema, connection, { port })
    } else if (dialect === 'sqlite') {
      if (driver === 'd1') {
        log.info(`Launching Drizzle Studio with D1 binding...`)
        // Trigger studio launch in the Nitro process for D1 binding access
        await fetch(`${nitroDevUrl}/api/_hub/db/launch-studio?port=${port}&driver=d1`, {
          method: 'POST'
        })
      } else {
        const { startStudioSQLiteServer } = await import('drizzle-kit/api')
        log.info(`Launching Drizzle Studio with SQLite (${driver})...`)
        // drizzle-kit auto-detects libsql from @libsql/client package
        // Only pass driver for d1-http, otherwise just pass connection
        const studioConnection = driver === 'd1-http'
          ? { driver: 'd1-http', ...connection }
          : connection
        await startStudioSQLiteServer(schema, studioConnection as any, { port })
      }
    } else {
      throw new Error(`Unsupported database dialect: ${dialect}`)
    }

    isReady = true
  } catch (error) {
    log.error('Failed to launch Drizzle Studio:', error)
    throw error
  }
}

export function addDevToolsCustomTabs(nuxt: Nuxt, hub: HubConfig) {
  nuxt.hook('devtools:customTabs', (tabs) => {
    if (nuxt.options.nitro.experimental?.openAPI)({
      category: 'server',
      name: 'hub-open-api',
      title: 'OpenAPI',
      icon: 'i-lucide-file-text',
      view: {
        type: 'iframe',
        src: `/_scalar`
      }
    })

    if (hub.db) tabs.push({
      category: 'server',
      name: 'hub-db',
      title: 'Database',
      icon: 'i-lucide-database',
      view: isReady && port
        ? {
            type: 'iframe',
            src: `https://local.drizzle.studio?port=${port}`,
            permissions: ['local-network-access https://local.drizzle.studio']
          }
        : {
            type: 'launch',
            description: 'Launch Drizzle Studio',
            actions: [{
              label: promise ? 'Starting...' : 'Launch',
              pending: isReady,
              handle() {
                promise = promise || launchDrizzleStudio(nuxt, hub)
                return promise
              }
            }]
          }
    })
  })
}
