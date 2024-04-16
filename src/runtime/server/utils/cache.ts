import type { ReadableStream } from '@cloudflare/workers-types/experimental'
import { ofetch } from 'ofetch'
import { joinURL } from 'ufo'
import { requireNuxtHubFeature } from './features'

/**
 * Access the remote Cache storage.
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
export function proxyHubCache(projectUrl: string, secretKey?: string) {
  requireNuxtHubFeature('cache')

  const cacheAPI = ofetch.create({
    baseURL: joinURL(projectUrl, '/api/_hub/cache'),
    headers: {
      Authorization: `Bearer ${secretKey}`
    }
  })

  const cache = {
    async list() {
      return cacheAPI<Record<string, number>>('/', {
        method: 'GET'
      })
    },
    async get(key: string) {
      return cacheAPI<any>(`/${key}`, {
        method: 'GET'
      })
    },
    async del(key: string) {
      await cacheAPI<void>(`/${key}`, {
        method: 'DELETE'
      })
      return
    }
  }

  return {
    ...cache
  }
}
