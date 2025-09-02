import { writeFile, cp } from 'node:fs/promises'
import { logger } from '@nuxt/kit'
import { join, resolve } from 'pathe'
import { defu } from 'defu'
import type { Nuxt } from '@nuxt/schema'
import type { Nitro } from 'nitropack'
import type { HubConfig } from '../features'

const log = logger.withTag('nuxt:hub')

function configureProductionDatabaseConnector(nitro: Nitro, hub: HubConfig) {
  // Only configure if production database connector is not already set
  if (nitro.options.database?.db?.connector) {
    log.info(`Using user-configured \`${nitro.options.database.db.connector}\` database connector`)
    return
  }

  const preset = nitro.options.preset
  const dialect = typeof hub.database === 'string' ? hub.database : hub.database

  if (!preset) {
    return
  }

  let databaseConfig: any = null

  switch (preset) {
    case 'vercel':
      if (dialect === true) {
        throw new Error('Database dialect must be set in `hub.database`, or a production database connector must be set in `nitro.database.db` within `nuxt.config.ts`')
      } else if (dialect === 'postgresql') {
        databaseConfig = {
          database: {
            db: {
              connector: 'postgresql',
              options: {
                url: process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL
              }
            }
          }
        }
      } else if (dialect === 'mysql') {
        throw new Error('MySQL connector requires manual configuration in `nitro.database.db` within `nuxt.config.ts`')
      } else if (dialect === 'sqlite') {
        throw new Error('SQLite connector requires manual configuration in `nitro.database.db` within `nuxt.config.ts`')
      }
      break

    case 'cloudflare-module':
    case 'cloudflare-durable':
    case 'cloudflare-pages':
      if (dialect === true || dialect === 'sqlite') {
        databaseConfig = {
          database: {
            db: {
              connector: 'cloudflare-d1',
              options: {
                bindingName: 'DB'
              }
            }
          }
        }
      } else if (dialect === 'postgresql') {
        // TODO: hyperdrive postgresql support
        log.warn('Zero-config PostgreSQL via Hyperdrive support is not yet implemented for Cloudflare presets')
      } else if (dialect === 'mysql') {
        // TODO: hyperdrive mysql support
        log.warn('Zero-config MySQL via Hyperdrive support is not yet implemented for Cloudflare presets')
      }
      break

    case 'node-server':
      if (dialect === true) {
        throw new Error('Database dialect must be set in `hub.database`, or a production database connector must be set in `nitro.database.db` within `nuxt.config.ts`')
      } else if (dialect === 'postgresql') {
        databaseConfig = {
          database: {
            db: {
              connector: 'postgresql',
              options: {
                url: process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL
              }
            }
          }
        }
      } else if (dialect === 'mysql') {
        throw new Error('MySQL connector requires manual configuration in `nitro.database.db` within `nuxt.config.ts`')
      } else if (dialect === 'sqlite') {
        databaseConfig = {
          database: {
            db: {
              connector: 'sqlite',
              options: {
                path: '.data/database/sqlite/db.sqlite3'
              }
            }
          }
        }
      }
      break

    case 'deno-server':
      if (dialect === true) {
        throw new Error('Database dialect must be set in `hub.database`, or a production database connector must be set in `nitro.database.db` within `nuxt.config.ts`')
      } else if (dialect === 'sqlite') {
        throw new Error('SQLite connector requires manual configuration in `nitro.database.db` within `nuxt.config.ts`')
      } else if (dialect === 'postgresql') {
        databaseConfig = {
          database: {
            db: {
              connector: 'postgresql',
              options: {
                url: process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL
              }
            }
          }
        }
      } else if (dialect === 'mysql') {
        throw new Error('MySQL connector requires manual configuration in `nitro.database.db` within `nuxt.config.ts`')
      }
      break

    case 'heroku':
    case 'digital-ocean':
    case 'netlify':
      if (dialect === true) {
        throw new Error('Database dialect must be set in `hub.database`, or a production database connector must be set in `nitro.database.db` within `nuxt.config.ts`')
      } else if (dialect === 'sqlite') {
        throw new Error('SQLite connector requires manual configuration in `nitro.database.db` within `nuxt.config.ts`')
      } else if (dialect === 'postgresql') {
        databaseConfig = {
          database: {
            db: {
              connector: 'postgresql',
              options: {
                url: process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.DATABASE_URL
              }
            }
          }
        }
      } else if (dialect === 'mysql') {
        throw new Error('MySQL connector requires manual configuration in `nitro.database.db` within `nuxt.config.ts`')
      }
      break

    default:
      // For other presets, we don't configure anything
      return

    // Is your favourite cloud platform not listed here? Feel free to open a PR to add zero-config database support for other presets
  }

  if (databaseConfig) {
    nitro.options = defu(nitro.options, databaseConfig)
    log.info(`Using zero-config \`${databaseConfig.database.db.connector}\` database connector`)
  }
}

export function addBuildHooks(nuxt: Nuxt, hub: HubConfig) {
  // Write `dist/hub.config.json` after public assets are built
  nuxt.hook('nitro:build:public-assets', async (nitro) => {
    const hubConfig = {
      // ai: hub.ai,
      blob: hub.blob,
      cache: hub.cache,
      database: hub.database,
      kv: hub.kv
    }
    const distDir = nitro.options.output.dir || nitro.options.output.publicDir
    await writeFile(join(distDir, 'hub.config.json'), JSON.stringify(hubConfig, null, 2), 'utf-8')

    if (hub.database) {
      try {
        await cp(resolve(nitro.options.rootDir, hub.dir!, 'database/migrations'), resolve(nitro.options.output.dir, 'database/migrations'), { recursive: true })
        await cp(resolve(nitro.options.rootDir, hub.dir!, 'database/queries'), resolve(nitro.options.output.dir, 'database/queries'), { recursive: true })
        log.info('Database migrations and queries included in build')
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          log.info('Skipping bundling database migrations - no migrations found')
        }
      }

      // Configure default production database connector based on nitro preset
      configureProductionDatabaseConnector(nitro, hub)
    }
  })
}
