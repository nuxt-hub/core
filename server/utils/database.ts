import type { D1Database } from '@cloudflare/workers-types/experimental'
import { drizzle as drizzleD1, DrizzleD1Database } from 'drizzle-orm/d1'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy'
import { ofetch } from 'ofetch'
import { joinURL } from 'ufo'
import type { H3Error } from 'h3'

export { sql } from 'drizzle-orm'

// TODO: generate #hub/database/schema from the database
export * as tables from '~/server/database/schema'

let _db: DrizzleD1Database | BetterSQLite3Database | SqliteRemoteDatabase
let _client: D1Database

export function useDatabase() {
  if (_db) {
    return _db
  }
  _db = drizzleD1(useDatabaseClient())
  return _db
}

export function useDatabaseClient() {
  if (_client) {
    return _client
  }
  if (!process.env.NUXT_HUB_URL) {
    const binding = process.env.DB || globalThis.__env__?.DB || globalThis.DB
    if (binding) {
      _client = binding as D1Database
      return _client
    }
    throw createError({ statusCode: 500, message: 'Missing Cloudflare DB binding (D1)' })
  }
  const d1API = ofetch.create({
    baseURL: joinURL(process.env.NUXT_HUB_URL, '/api/_hub/database'),
    method: 'POST',
  })

  _client = {
    async exec(query: string) {
      return d1API<D1ExecResult>('/exec', {
        body: { query },
      }).catch(handleProxyError)
    },
    async dump() {
      return d1API<ArrayBuffer>('/dump').catch(handleProxyError)
    },
    prepare(query: string) {
      const stmt = {
        _body: {
          query,
          params: [] as unknown[]
        },
        bind(...params: unknown[]) {
          return {
            ...stmt,
            _body: { query, params }
          }
        },
        async all() {
          return d1API('/all', { body: this._body }).catch(handleProxyError)
        },
        async raw() {
          return d1API('/raw', { body: this._body }).catch(handleProxyError)
        },
        async run() {
          return d1API('/run', { body: this._body }).catch(handleProxyError)
        },
        async first(colName?: string) {
          return d1API('/first', {
            body: {
              ...this._body,
              colName
            }
          }).catch(handleProxyError).then(res => res || null)
        }
      }
      return stmt as D1PreparedStatement
    },
    batch(statements: D1PreparedStatement[]) {
      return d1API('/batch', {
        // @ts-ignore
        body: statements.map(smtm => smtm._body)
      })
    }
  } as D1Database

  return _client
}

function handleProxyError(err: H3Error) {
  throw createError({
    statusCode: err.statusCode,
    // @ts-ignore
    message: err.data?.message || err.message
  })
}
