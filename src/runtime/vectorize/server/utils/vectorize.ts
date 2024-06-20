import { ofetch } from 'ofetch'
import { joinURL } from 'ufo'
import { createError } from 'h3'
import type { H3Error } from 'h3'
import type { VectorizeIndex } from '../../../../types/vectorize'
import { requireNuxtHubFeature } from '../../../utils/features'
import { useRuntimeConfig } from '#imports'

let _vectorize: VectorizeIndex

/**
 * Access the Vectorize database.
 *
 * @example ```ts
 * const vectorize = hubVectorize()
 * let vectorsToInsert = [
 *   {id: "123", values: [32.4, 6.5, 11.2, 10.3, 87.9]},
 *   {id: "456", values: [2.5, 7.8, 9.1, 76.9, 8.5]},
 * ]
 * let inserted = await vectorize.insert(vectorsToInsert)
 * ```
 *
 * Vectorize is currently only supported with `--remote`. See https://developers.cloudflare.com/workers/testing/local-development/#supported-resource-bindings-in-different-environments for details.
 *
 * @see https://developers.cloudflare.com/vectorize/reference/client-api/
 */
export function hubVectorize(): VectorizeIndex {
  requireNuxtHubFeature('vectorize')

  if (_vectorize) {
    return _vectorize
  }
  const hub = useRuntimeConfig().hub
  // @ts-expect-error globalThis.__env__ is not defined
  const binding = process.env.VECTORIZE || globalThis.__env__?.VECTORIZE || globalThis.VECTORIZE
  if (hub.remote && hub.projectUrl && !binding) {
    _vectorize = proxyHubVectorize(hub.projectUrl, hub.projectSecretKey || hub.userToken)
    return _vectorize
  }
  if (binding) {
    _vectorize = binding as VectorizeIndex
    return _vectorize
  }
  throw createError('Missing Cloudflare Vectorize binding (Vectorize)')
}

/**
 * Access the remote Vectorize database.
 *
 * @param projectUrl The project URL (e.g. https://my-deployed-project.nuxt.dev)
 * @param secretKey The secret key to authenticate to the remote endpoint
 *
 * @example ```ts
 * const db = proxyHubVectorize('https://my-deployed-project.nuxt.dev', 'my-secret-key')
 * let vectorsToInsert = [
 *   {id: "123", values: [32.4, 6.5, 11.2, 10.3, 87.9]},
 *   {id: "456", values: [2.5, 7.8, 9.1, 76.9, 8.5]},
 * ]
 * let inserted = await vectorize.insert(vectorsToInsert)
 * ```
 *
 * @see https://developers.cloudflare.com/vectorize/reference/client-api/
 */
export function proxyHubVectorize(projectUrl: string, secretKey?: string): VectorizeIndex {
  requireNuxtHubFeature('vectorize')

  const vectorizeAPI = ofetch.create({
    baseURL: joinURL(projectUrl, '/api/_hub/vectorize'),
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`
    }
  })
  return {
    async insert(vectors: { id: string, namespace?: string, values: number[], metadata?: Record<string, unknown> }[]) {
      return vectorizeAPI('/insert', { body: { vectors } }).catch(handleProxyError)
    },

    async upsert(vectors: { id: string, namespace?: string, values: number[], metadata?: Record<string, unknown> }[]) {
      return vectorizeAPI('/upsert', { body: { vectors } }).catch(handleProxyError)
    },

    async query(query: number[], params: { topK?: number, namespace?: string, returnValues?: boolean, returnMetadata?: boolean, filter?: Record<string, unknown> }) {
      return vectorizeAPI('/query', { body: { query, params } }).catch(handleProxyError)
    },

    async getByIds(ids: string[], namespace?: string) {
      return vectorizeAPI('/getByIds', { body: { ids, namespace } }).catch(handleProxyError)
    },

    async deleteByIds(ids: string[], namespace?: string) {
      return vectorizeAPI('/deleteByIds', { body: { ids, namespace } }).catch(handleProxyError)
    },

    async describe() {
      return vectorizeAPI('/describe').catch(handleProxyError)
    }
  } as VectorizeIndex
}

function handleProxyError(err: H3Error) {
  throw createError({
    statusCode: err.statusCode,
    // @ts-expect-error not aware of data property
    message: err.data?.message || err.message
  })
}
