import { ofetch } from 'ofetch'
import { joinURL } from 'ufo'
import { createError } from 'h3'
import type { KVNamespace } from '@cloudflare/workers-types'
import { requireNuxtHubFeature } from '../../../utils/features'

export function hubCacheBinding(name: string = 'CACHE'): KVNamespace {
  const binding = process.env[name] || globalThis.__env__?.[name] || globalThis[name]
  if (!binding) {
    throw createError(`Missing Cloudflare KV binding (${name})`)
  }
  return binding as KVNamespace
}

/**
 * Manage server cache
 *
 * @param projectUrl The project URL (e.g. https://my-deployed-project.nuxt.dev)
 * @param secretKey The secret key to authenticate to the remote endpoint
 *
 * @example ```ts
 * const cache = proxyHubCache('https://my-deployed-project.nuxt.dev', 'my-secret-key')
 * const caches = await cache.list()
 * ```
 *
 */
export function proxyHubCache(projectUrl: string, secretKey?: string, headers?: HeadersInit) {
  requireNuxtHubFeature('cache')

  const cacheAPI = ofetch.create({
    baseURL: joinURL(projectUrl, '/api/_hub/cache'),
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...headers
    }
  })

  const cache = {
    async list() {
      return cacheAPI<Record<string, number>>('/', {
        method: 'GET'
      })
    },
    async get(key: string) {
      return cacheAPI(`/${key}`, {
        method: 'GET'
      })
    },
    async del(key: string) {
      await cacheAPI(`/${key}`, {
        method: 'DELETE'
      })
      return
    },
    async clear(base: string) {
      await cacheAPI(`/clear/${base}`, {
        method: 'DELETE'
      })
      return
    },
    async batchDel(keys: string[]) {
      await cacheAPI('/batch-delete', {
        method: 'POST',
        body: { keys }
      })
      return
    }
  }

  return cache
}
