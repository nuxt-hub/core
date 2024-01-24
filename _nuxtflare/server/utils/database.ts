import { drizzle as drizzleD1, DrizzleD1Database } from 'drizzle-orm/d1'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzleHTTP } from 'drizzle-orm/sqlite-proxy'
import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy'
import { ofetch } from 'ofetch'
// @ts-ignore
import Database from 'better-sqlite3'
import { join } from 'pathe'

// export * as tables from '~/server/database/schema'

let _db: DrizzleD1Database | BetterSQLite3Database | SqliteRemoteDatabase | null = null
let _client: any = null

export const useDatabase = () => {
  if (!_db) {
    const isDev = process.env.NODE_ENV === 'development'
    if (process.env.DB) {
      // d1 in production
      _client = process.env.DB
      _db = drizzleD1(_client)
    } else if (isDev && process.env.NUXT_HUB_URL) {
      console.log('Using D1 remote database...')
      _db = drizzleHTTP(async (sql, params, method) => {
        // https://orm.drizzle.team/docs/get-started-sqlite#http-proxy
        try {
          const rows = await ofetch('/api/db/query', {
            baseURL: process.env.NUXT_HUB_URL,
            method: 'POST',
            body: { sql, params, method }
          })
          return { rows }
        } catch (err) {
          console.error('Error from remote database', err)
          return { rows: [] }
        }
      })
    } else if (isDev) {
      // local sqlite in development
      console.log('Using local database...')
      _client = new Database(join(process.cwd(), './db.sqlite'))
      _db = drizzle(_client)
    } else {
      throw new Error('No database configured for production')
    }
  }
  return _db
}

export const useDatabaseClient = () => {
  if (!_client) {
    throw new Error('No client configured')
  }
  return _client
}