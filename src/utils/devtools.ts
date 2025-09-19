import { logger } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import type { HubConfig } from '../features'
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
    const dbConfig = nuxt.options.nitro.devDatabase?.db
    if (!dbConfig?.connector) {
      throw new Error('No database configuration found. Please configure your database in nuxt.config.ts')
    }

    // Determine dialect from connector
    let dialect: string
    let dbCredentials: any

    if (dbConfig.connector === 'postgresql' || dbConfig.connector === 'pglite') {
      dialect = 'postgresql'
      if (dbConfig.connector === 'pglite') {
        dbCredentials = {
          url: dbConfig.options?.dataDir || './database/'
        }
      } else {
        dbCredentials = {
          url: dbConfig.options?.url
        }
      }
    } else if (['better-sqlite3', 'bun-sqlite', 'bun', 'node-sqlite', 'sqlite3'].includes(dbConfig.connector)) {
      dialect = 'sqlite'
      dbCredentials = {
        url: dbConfig.options?.path
      }
    } else if (dbConfig.connector === 'mysql2') {
      dialect = 'mysql'
      dbCredentials = {
        url: dbConfig.options?.url || process.env.DATABASE_URL
      }
    } else {
      throw new Error(`Unsupported database connector: ${dbConfig.connector}`)
    }

    // Generate drizzle config content
    const drizzleConfig = `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "${dialect}"${dbConfig.connector === 'pglite' ? ',\n  driver: "pglite"' : ''},
  dbCredentials: ${JSON.stringify(dbCredentials, null, 2)}
});`

    const drizzleConfigNuxtPath = join(nuxt.options.buildDir, 'drizzle.config.ts')
    await writeFile(drizzleConfigNuxtPath, drizzleConfig, 'utf-8')

    const cmd = dlxCommand(packageManager.name, 'drizzle-kit', {
      args: [
        'studio',
        '--config', drizzleConfigNuxtPath,
        '--port', port.toString()
      ],
      packages: [dbConfig.connector, 'drizzle-orm', 'drizzle-kit']
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
