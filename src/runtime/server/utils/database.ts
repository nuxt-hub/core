import type { D1Database } from '@cloudflare/workers-types/experimental'
import { ofetch } from 'ofetch'
import { joinURL } from 'ufo'
import { createError } from 'h3'
import type { H3Error } from 'h3'
import { useRuntimeConfig } from '#imports'

let _db: D1Database

export function useDatabase(): D1Database {
  if (_db) {
    return _db
  }
  const hub = useRuntimeConfig().hub
  if (import.meta.dev && hub.projectUrl) {
    _db = useProxyDatabase(hub.projectUrl, hub.projectSecretKey || hub.userToken)
    return _db
  }
  // @ts-ignore
  const binding = process.env.DB || globalThis.__env__?.DB || globalThis.DB
  if (binding) {
    _db = binding as D1Database
    return _db
  }
  throw createError('Missing Cloudflare DB binding (D1)')
}

export function useProxyDatabase(projectUrl: string, secretKey?: string): D1Database {
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
}

function handleProxyError(err: H3Error) {
  throw createError({
    statusCode: err.statusCode,
    // @ts-ignore
    message: err.data?.message || err.message
  })
}
