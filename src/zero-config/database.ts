import { logger } from '@nuxt/kit'
import { defu } from 'defu'
import { ensureDependencyInstalled } from 'nypm'

import type { Nitro, NitroOptions } from 'nitropack'
import type { HubConfig } from '../features'

const log = logger.withTag('nuxt:hub')

export async function configureProductionDatabaseConnector(nitro: Nitro, hub: HubConfig) {
  const preset = nitro.options.preset
  if (!preset) return

  // Only configure if production database connector is not already set
  if (nitro.options.database?.db?.connector) {
    log.info(`Using user-configured \`${nitro.options.database.db.connector}\` database connector`)
    return
  }

  const dialect = typeof hub.database === 'string' ? hub.database : hub.database

  let databaseConfig: NitroOptions['database']['default']

  switch (preset) {
    // Does your favourite cloud provider require special configuration? Feel free to open a PR to add zero-config support for other presets

    case 'vercel': {
      if (dialect === true || dialect === 'postgresql') {
        databaseConfig = {
          connector: 'postgresql',
          options: {
            url: process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL
          }
        }
        if (!process.env.POSTGRES_URL && !process.env.POSTGRESQL_URL && !process.env.DATABASE_URL) {
          log.warn('Set POSTGRES_URL, POSTGRESQL_URL, or DATABASE_URL environment variable to configure PostgreSQL database')
          if (hub.applyDatabaseMigrationsDuringBuild) {
            hub.applyDatabaseMigrationsDuringBuild = false
            log.warn('Skipping database migrations - missing database environment variables')
          }
        }
      } else if (dialect === 'mysql') {
        throw new Error('MySQL connector requires manual configuration in `nitro.database.db` within `nuxt.config.ts`')
      } else if (dialect === 'sqlite') {
        throw new Error('SQLite connector requires manual configuration in `nitro.database.db` within `nuxt.config.ts`')
      }
      break
    }

    case 'cloudflare-module':
    case 'cloudflare-durable':
    case 'cloudflare-pages': {
      nitro.options.cloudflare ||= {}

      const isPages = preset === 'cloudflare-pages'
      if (dialect === true || dialect === 'sqlite') {
        databaseConfig = {
          connector: 'cloudflare-d1',
          options: {
            bindingName: 'DB'
          }
        }
        log.info(`Ensure a \`DB\` binding is set in your Cloudflare ${isPages ? 'Pages' : 'Workers'} configuration`)

        nitro.options.cloudflare.wrangler ||= {}
        nitro.options.cloudflare.wrangler.d1_databases ||= []

        let dbBinding = nitro.options.cloudflare.wrangler.d1_databases.find(db => db.binding === 'DB')
        if (!dbBinding) {
          dbBinding = { binding: 'DB' }
          nitro.options.cloudflare.wrangler.d1_databases.push(dbBinding)
        }

        dbBinding.migrations_table ||= '_hub_migrations'
        dbBinding.migrations_dir ||= 'migrations'
      } else if (dialect === 'postgresql') {
        databaseConfig = {
          connector: 'cloudflare-hyperdrive-postgresql',
          options: {
            bindingName: 'DB'
          }
        }

        log.info(`Ensure a \`DB\` binding is set in your Cloudflare ${isPages ? 'Pages' : 'Workers'} configuration`)
      } else if (dialect === 'mysql') {
        databaseConfig = {
          connector: 'cloudflare-hyperdrive-mysql',
          options: {
            bindingName: 'DB'
          }
        }
        log.info(`Ensure a \`DB\` binding is set in your Cloudflare ${isPages ? 'Pages' : 'Workers'} configuration`)
      }

      // TODO: D1 migrations via wrangler migrations dir
      if (hub.applyDatabaseMigrationsDuringBuild) {
        hub.applyDatabaseMigrationsDuringBuild = false
        log.warn('Skipping database migrations - Currently Cloudflare is not supported')
      }
      break
    }

    default: {
      if (dialect === true) {
        throw new Error('Database dialect must be set in `hub.database`, or a production database connector must be set in `nitro.database.db` within `nuxt.config.ts`')
      } else if (dialect === 'postgresql') {
        databaseConfig = {
          connector: 'postgresql',
          options: {
            url: process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL
          }
        }
        if (!process.env.POSTGRES_URL && !process.env.POSTGRESQL_URL && !process.env.DATABASE_URL) {
          log.info('Set `POSTGRES_URL`, `POSTGRESQL_URL`, or `DATABASE_URL` environment variable to configure PostgreSQL database')
          if (hub.applyDatabaseMigrationsDuringBuild) {
            hub.applyDatabaseMigrationsDuringBuild = false
            log.warn('Skipping database migrations - missing database environment variables')
          }
        }
      } else if (dialect === 'mysql') {
        throw new Error('MySQL connector requires manual configuration in `nitro.database.db` within `nuxt.config.ts`')
      } else if (dialect === 'sqlite') {
        databaseConfig = {
          connector: 'sqlite',
          options: {
            path: '.data/database/sqlite/db.sqlite3'
          }
        }
      }
      break
    }
  }

  if (databaseConfig!) {
    // check if connector dependencies are installed
    switch (databaseConfig.connector) {
      case 'postgresql':
        await ensureDependencyInstalled('pg')
        break
      case 'better-sqlite3':
        await ensureDependencyInstalled('better-sqlite3')
        break
      case 'mysql2':
        await ensureDependencyInstalled('mysql2')
        break
    }

    // set connector
    // @ts-expect-error temporarily set to empty object
    nitro.options.database ||= {}
    nitro.options.database.db = defu(nitro.options.database?.db, databaseConfig) as any
    log.info(`Using zero-config \`${databaseConfig.connector}\` database connector`)
  }
}
