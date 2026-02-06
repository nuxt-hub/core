import { logger } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import type { HubConfig, ResolvedDatabaseConfig } from '@nuxthub/core'
import { getPort } from 'get-port-please'
import { glob } from 'tinyglobby'

let isReady = false
let promise: Promise<any> | null = null
// Default port for database studio (Drizzle Studio uses this convention)
let port = 4983

const log = logger.withTag('nuxt:hub')

async function launchDatabaseStudio(nuxt: Nuxt, hub: HubConfig) {
  const dbConfig = hub.db as ResolvedDatabaseConfig
  if (!dbConfig) {
    throw new Error('Database configuration not resolved properly. Please ensure database is configured in hub.db')
  }

  port = await getPort({ port: 4983 })
  const { orm, dialect, driver, connection } = dbConfig

  try {
    // Prisma Studio
    if (orm === 'prisma') {
      log.info(`Launching Prisma Studio on port ${port}...`)
      const { execa } = await import('execa')
      // Use execa with array args to avoid shell injection, don't await - studio runs in background
      const childProcess = execa('npx', ['prisma', 'studio', '--port', String(port)], {
        cwd: nuxt.options.rootDir,
        stdio: 'inherit',
        reject: false
      })
      // Wait briefly for studio to start, then mark as ready
      await new Promise(resolve => setTimeout(resolve, 2000))
      if (childProcess.exitCode !== null && childProcess.exitCode !== 0) {
        throw new Error(`Prisma Studio failed to start (exit code: ${childProcess.exitCode})`)
      }
      isReady = true
      return
    }

    // Drizzle Studio
    const { schema } = await import(nuxt.options.alias!['hub:db'] as string)

    if (dialect === 'postgresql') {
      if (driver === 'pglite') {
        log.info(`Launching Drizzle Studio with PGlite...`)
        const nitroDevUrl = `${nuxt.options.devServer.https ? 'https' : 'http'}://localhost:${nuxt.options.devServer.port || 3000}`
        try {
          await fetch(`${nitroDevUrl}/api/_hub/db/launch-studio?port=${port}`, { method: 'POST' })
        } catch (fetchError) {
          throw new Error(`Failed to launch PGlite studio - is the dev server running? ${fetchError}`)
        }
      } else {
        const { startStudioPostgresServer } = await import('drizzle-kit/api')
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
    log.error('Failed to launch database studio:', error)
    throw error
  }
}

export function addDevToolsCustomTabs(nuxt: Nuxt, hub: HubConfig) {
  nuxt.hook('devtools:customTabs', (tabs) => {
    if (nuxt.options.nitro.experimental?.openAPI) {
      tabs.push({
        category: 'server',
        name: 'hub-open-api',
        title: 'OpenAPI',
        icon: 'i-lucide-file-text',
        view: {
          type: 'iframe',
          src: `/_scalar`
        }
      })
    }

    if (hub.db) {
      const dbConfig = hub.db as ResolvedDatabaseConfig
      const orm = dbConfig?.orm || 'drizzle'
      const studioName = orm === 'prisma' ? 'Prisma Studio' : 'Drizzle Studio'
      const studioUrl = orm === 'prisma' ? `http://localhost:${port}` : `https://local.drizzle.studio?port=${port}`
      const permissions = orm === 'prisma' ? [] : ['local-network-access https://local.drizzle.studio']

      tabs.push({
        category: 'server',
        name: 'hub-db',
        title: 'Database',
        icon: 'i-lucide-database',
        view: isReady && port
          ? { type: 'iframe', src: studioUrl, permissions }
          : {
              type: 'launch',
              description: `Launch ${studioName}`,
              actions: [{
                label: promise ? 'Starting...' : 'Launch',
                pending: !!promise && !isReady,
                handle() {
                  promise = promise || launchDatabaseStudio(nuxt, hub)
                  return promise
                }
              }]
            }
      })
    }
  })
}
