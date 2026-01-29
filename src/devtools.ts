import { logger } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import type { HubConfig, ResolvedDatabaseConfig } from '@nuxthub/core'
import { getPort } from 'get-port-please'
import { glob } from 'tinyglobby'

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
    const { schema } = await import(nuxt.options.alias!['hub:db'] as string)

    // Launch Drizzle Studio based on dialect and driver
    if (dialect === 'postgresql') {
      if (driver === 'pglite') {
        log.info(`Launching Drizzle Studio with PGlite...`)

        // Trigger studio launch in the Nitro process for PGlite instance
        const nitroDevUrl = `${nuxt.options.devServer.https ? 'https' : 'http'}://localhost:${nuxt.options.devServer.port || 3000}`
        await fetch(`${nitroDevUrl}/api/_hub/db/launch-studio?port=${port}`, {
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
      const { startStudioSQLiteServer } = await import('drizzle-kit/api')
      log.info(`Launching Drizzle Studio with SQLite (${driver})...`)

      let studioConnection: any
      if (driver === 'd1-http') {
        studioConnection = { driver: 'd1-http', ...connection }
      } else if (driver === 'd1') {
        // Find wrangler D1 sqlite file for local development
        const d1Files = await glob('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite', {
          cwd: nuxt.options.rootDir,
          absolute: true
        })
        if (!d1Files.length) {
          log.warn('D1 database file not found. Run the dev server first to create it.')
          return
        }
        studioConnection = { url: `file:${d1Files[0]}` }
      } else {
        studioConnection = connection
      }

      await startStudioSQLiteServer(schema, studioConnection as any, { port })
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
