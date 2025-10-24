import { logger } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import type { HubConfig, ResolvedDatabaseConfig } from '../types'
import { checkPort, getPort } from 'get-port-please'
import { writeFile } from 'node:fs/promises'
import { detectPackageManager, dlxCommand } from 'nypm'
import { execa } from 'execa'
import { join } from 'pathe'

let isReady = false
let promise: Promise<any> | null = null
let port = 4983

const log = logger.withTag('nuxt:hub')

async function launchDrizzleStudio(nuxt: Nuxt) {
  const packageManager = await detectPackageManager(nuxt.options.rootDir)
  if (!packageManager) {
    throw new Error('Could not detect package manager')
  }

  port = await getPort({ port: 4983 })

  try {
    const dbConfig = nuxt.options.runtimeConfig?.hub?.database as unknown as ResolvedDatabaseConfig | undefined
    if (!dbConfig || typeof dbConfig === 'boolean' || typeof dbConfig === 'string') {
      throw new Error('Database configuration not resolved properly. Please ensure database is configured in hub.database')
    }

    // TODO: custom drizzle connector
    if (dbConfig.driver === 'pglite') {
      throw new Error('Database viewer currently does not support PGlite.')
    }

    const { dialect, driver, connection } = dbConfig

    // Prepare database credentials for Drizzle Studio
    let dbCredentials = connection

    if (driver === 'node-postgres') {
      dbCredentials = { url: connection.connectionString }
    }

    // Generate drizzle config content
    const drizzleConfig = `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "${dialect}",
  dbCredentials: ${JSON.stringify(dbCredentials, null, 2)}
});`

    const drizzleConfigNuxtPath = join(nuxt.options.buildDir, 'drizzle.config.ts')
    await writeFile(drizzleConfigNuxtPath, drizzleConfig, 'utf-8')

    // Map driver to package dependency
    const driverToPackage: Record<string, string> = {
      'better-sqlite3': 'better-sqlite3',
      libsql: '@libsql/client',
      'node-postgres': 'pg',
      mysql2: 'mysql2',
      pglite: '@electric-sql/pglite'
    }

    const connectorDependency = driverToPackage[driver] || driver

    const cmd = dlxCommand(packageManager.name, 'drizzle-kit', {
      args: [
        'studio',
        '--config', drizzleConfigNuxtPath,
        '--port', port.toString()
      ],
      packages: [connectorDependency, 'drizzle-orm', 'drizzle-kit']
    })

    // Launch Drizzle Studio
    log.info(`Launching Drizzle Studio...`)

    execa(cmd, {
      cwd: nuxt.options.rootDir,
      stdio: 'inherit',
      shell: true
    })

    // Wait for Drizzle Studio to be ready
    const checkInterval = 100 // 100ms
    while (!isReady) {
      const portCheck = await checkPort(port)
      if (portCheck !== false) {
        isReady = true
        break
      }
      await new Promise(resolve => setTimeout(resolve, checkInterval))
    }
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
                promise = promise || launchDrizzleStudio(nuxt)
                return promise
              }
            }]
          }
    })
  })
}
