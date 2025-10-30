import { logger } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import type { HubConfig, ResolvedDatabaseConfig } from '../types'
import { getPort } from 'get-port-please'

let isReady = false
let promise: Promise<any> | null = null
let port = 4983

const log = logger.withTag('nuxt:hub')

async function launchDrizzleStudio(nuxt: Nuxt, hub: HubConfig) {
  const dbConfig = hub.database as ResolvedDatabaseConfig
  if (!dbConfig || typeof dbConfig === 'boolean' || typeof dbConfig === 'string') {
    throw new Error('Database configuration not resolved properly. Please ensure database is configured in hub.database')
  }

  port = await getPort({ port: 4983 })

  try {
    const { dialect, driver, connection } = dbConfig
    const schema = {} // Empty schema for now, could be extended to support custom schemas

    // Launch Drizzle Studio based on dialect and driver
    if (dialect === 'postgresql') {
      if (driver === 'pglite') {
        log.info(`Launching Drizzle Studio with PGlite...`)

        // Trigger studio launch in the Nitro process for PGlite instance
        const nitroDevUrl = `http://localhost:${nuxt.options.devServer.port || 3000}`
        await fetch(`${nitroDevUrl}/api/_hub/database/launch-studio?port=${port}`, {
          method: 'POST'
        })
      } else {
        const { startStudioPostgresServer } = await import('drizzle-kit/api')
        // For node-postgres and other PostgreSQL drivers
        log.info(`Launching Drizzle Studio with PostgreSQL...`)
        await startStudioPostgresServer(schema, connection, { port })
      }
    } else if (dialect === 'mysql') {
      const { startStudioMySQLServer } = await import('drizzle-kit/api')
      log.info(`Launching Drizzle Studio with MySQL...`)
      await startStudioMySQLServer(schema, connection, { port })
    } else if (dialect === 'sqlite') {
      const { startStudioSQLiteServer } = await import('drizzle-kit/api')
      log.info(`Launching Drizzle Studio with SQLite...`)
      // @ts-expect-error - SQLite credentials typed incorrectly
      await startStudioSQLiteServer(schema, connection, { port })
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

    if (hub.database) tabs.push({
      category: 'server',
      name: 'hub-database',
      title: 'Database',
      icon: 'i-lucide-database',
      view: isReady && port
        ? {
            type: 'iframe',
            src: `https://local.drizzle.studio?port=${port}`
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
