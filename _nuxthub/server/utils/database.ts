import { drizzle as drizzleD1, DrizzleD1Database } from 'drizzle-orm/d1'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzleHTTP } from 'drizzle-orm/sqlite-proxy'
import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy'
import { ofetch } from 'ofetch'
// @ts-ignore
import Database from 'better-sqlite3'
import { join } from 'pathe'

export * as tables from '~/server/database/schema'

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
          const rows = await ofetch('/api/_hub/database/query', {
            baseURL: process.env.NUXT_HUB_URL,
            method: 'POST',
            body: { sql, params, method },
            headers: {
              Authorization: `Bearer ${process.env.NUXT_HUB_SECRET_KEY}`
            }
          })
          if (method === 'run') return rows
          return { rows }
        } catch (err: any) {
          if (['begin', 'commit'].includes(sql)) {
            return { rows: [] }
          }
          console.error('Error from remote database:', err.data.message, '\n', { sql, params, method })
          return { rows: [] }
        }
      })
    } else if (isDev) {
      // local sqlite in development
      console.log('Using local database...')
      _client = new Database(join(process.cwd(), './.hub/db.sqlite'))
      _db = drizzle(_client)
    } else {
      throw new Error('No database configured for production')
    }
  }
  return _db
}

export const useDatabaseClient = () => {
  if (!_client) {
    useDatabase()
  }
  return _client
}