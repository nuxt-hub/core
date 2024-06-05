import type { D1Database } from '@cloudflare/workers-types/experimental'
import { ofetch } from 'ofetch'
import { joinURL } from 'ufo'
import { createError } from 'h3'
import type { H3Error } from 'h3'
import { requireNuxtHubFeature } from './features'
import { useRuntimeConfig } from '#imports'

let _db: D1Database

/**
 * Access the D1 database.
 *
 * @example ```ts
 * const db = hubDatabase()
 * const result = await db.exec('SELECT * FROM table')
 * ```
 *
 * @see https://hub.nuxt.com/docs/storage/database
 */
export function hubDatabase(): D1Database {
  requireNuxtHubFeature('database')

  if (_db) {
    return _db
  }
  const hub = useRuntimeConfig().hub
  // @ts-expect-error globalThis.__env__ is not defined
  const binding = process.env.DB || globalThis.__env__?.DB || globalThis.DB
  if (hub.remote && hub.projectUrl && !binding) {
    _db = proxyHubDatabase(hub.projectUrl, hub.projectSecretKey || hub.userToken)
    return _db
  }
  if (binding) {
    _db = binding as D1Database
    return _db
  }
  throw createError('Missing Cloudflare DB binding (D1)')
}

/**
 * Access the remote D1 database.
 *
 * @param projectUrl The project URL (e.g. https://my-deployed-project.nuxt.dev)
 * @param secretKey The secret key to authenticate to the remote endpoint
 *
 * @example ```ts
 * const db = proxyHubDatabase('https://my-deployed-project.nuxt.dev', 'my-secret-key')
 * await db.exec('SELECT * FROM table')
 * ```
 *
 * @see https://hub.nuxt.com/docs/storage/database
 */
export function proxyHubDatabase(projectUrl: string, secretKey?: string): D1Database {
  requireNuxtHubFeature('database')

  const d1API = ofetch.create({
    baseURL: joinURL(projectUrl, '/api/_hub/database'),
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`
    }
  })
  return {
    async exec(query: string) {
      return d1API<D1ExecResult>('/exec', {
        body: { query }
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
        async raw(options?: { columnNames?: boolean }) {
          return d1API('/raw', {
            body: {
              ...this._body,
              ...options
            }
          }).catch(handleProxyError)
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
        // @ts-expect-error _body is not recognized but internally used
        body: statements.map(smtm => smtm._body)
      })
    }
  } as D1Database
}

function handleProxyError(err: H3Error) {
  throw createError({
    statusCode: err.statusCode,
    // @ts-expect-error not aware of data property
    message: err.data?.message || err.message
  })
}
