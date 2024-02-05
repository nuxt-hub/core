import type { D1Database } from '@cloudflare/workers-types/experimental'
import { drizzle as drizzleD1, DrizzleD1Database } from 'drizzle-orm/d1'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzleHTTP } from 'drizzle-orm/sqlite-proxy'
import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy'
import { ofetch } from 'ofetch'

export * as tables from '~/server/database/schema'

let _db: DrizzleD1Database | BetterSQLite3Database | SqliteRemoteDatabase
let _client: D1Database

export function useDatabase () {
  if (!_db) {
    if (import.meta.dev && process.env.NUXT_HUB_URL) {
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
    } else {
      const binding = process.env.DB || globalThis.__env__?.DB || globalThis.DB
      if (binding) {
        _client = binding as D1Database
        _db = drizzleD1(_client)
        import.meta.dev && console.log('Using D1 local database...')
      } else {
        throw createError('Missing Cloudflare D1 binding DB')
      }
    }
  }
  return _db
}

export function useDatabaseClient () {
  if (!_client) {
    useDatabase()
  }
  return _client
}
