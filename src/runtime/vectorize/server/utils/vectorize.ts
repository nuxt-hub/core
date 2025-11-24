import { ofetch } from 'ofetch'
import { joinURL } from 'ufo'
import { createError } from 'h3'
import type { H3Error } from 'h3'
import type { RuntimeConfig } from 'nuxt/schema'
import { requireNuxtHubFeature } from '../../../utils/features'
import { getCloudflareAccessHeaders } from '../../../utils/cloudflareAccess'
import type { Vectorize } from '@nuxthub/core'
import { useRuntimeConfig } from '#imports'

const _vectorize: Record<string, Vectorize> = {}

type VectorizeIndexes = keyof RuntimeConfig['hub']['vectorize'] & string

/**
 * Access the Vectorize database.
 *
 * @param index The Vectorize index to access
 *
 * @example ```ts
 * const vectorize = hubVectorize('products')
 * let vectorsToInsert = [
 *   {id: "123", values: [32.4, 6.5, 11.2, 10.3, 87.9]},
 *   {id: "456", values: [2.5, 7.8, 9.1, 76.9, 8.5]},
 * ]
 * let inserted = await vectorize.insert(vectorsToInsert)
 * ```
 *
 * Vectorize is currently only supported with `--remote`.
 *
 * @see https://hub.nuxt.com/docs/features/vectorize
 * @deprecated See https://hub.nuxt.com/docs/features/vectorize#migration for more information.
 */
export function hubVectorize(index: VectorizeIndexes): Vectorize | undefined {
  requireNuxtHubFeature('vectorize')

  if (_vectorize[index]) {
    return _vectorize[index]
  }

  const hub = useRuntimeConfig().hub
  const bindingName = `VECTORIZE_${index.toUpperCase()}`

  // @ts-expect-error globalThis.__env__ is not defined
  const binding = process.env[bindingName] || globalThis.__env__?.[bindingName] || globalThis[bindingName]
  if (hub.remote && hub.projectUrl && !binding) {
    const cfAccessHeaders = getCloudflareAccessHeaders(hub.cloudflareAccess)
    _vectorize[index] = proxyHubVectorize(index, hub.projectUrl, hub.projectSecretKey || hub.userToken, cfAccessHeaders)
    return _vectorize[index]
  }
  if (binding) {
    _vectorize[index] = binding as Vectorize
    return _vectorize[index]
  }
  if (import.meta.dev && !hub.remote) {
    return undefined
  }

  throw createError(`Missing Cloudflare Vectorize binding (${bindingName})`)
}

/**
 * Access the remote Vectorize database.
 *
 * @param index The Vectorize index to access
 * @param projectUrl The project URL (e.g. https://my-deployed-project.nuxt.dev)
 * @param secretKey The secret key to authenticate to the remote endpoint
 * @param headers The headers to send with the request to the remote endpoint
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
export function proxyHubVectorize(index: VectorizeIndexes, projectUrl: string, secretKey?: string, headers?: HeadersInit): Vectorize {
  requireNuxtHubFeature('vectorize')

  const vectorizeAPI = ofetch.create({
    baseURL: joinURL(projectUrl, `/api/_hub/vectorize/${index}`),
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...headers
    }
  })
  return {
    async insert(vectors: { id: string, namespace?: string, values: number[], metadata?: Record<string, unknown> }[]) {
      return vectorizeAPI('/insert', { body: { vectors } }).catch(handleProxyError)
    },

    async upsert(vectors: { id: string, namespace?: string, values: number[], metadata?: Record<string, unknown> }[]) {
      return vectorizeAPI('/upsert', { body: { vectors } }).catch(handleProxyError)
    },

    async query(query: number[], params: { topK?: number, namespace?: string, returnValues?: boolean, returnMetadata?: 'none' | 'indexed' | 'all', filter?: Record<string, unknown> }) {
      return vectorizeAPI('/query', { body: { query, params } }).catch(handleProxyError)
    },

    async getByIds(ids: string[]) {
      return vectorizeAPI('/getByIds', { body: { ids } }).catch(handleProxyError)
    },

    async deleteByIds(ids: string[]) {
      return vectorizeAPI('/deleteByIds', { body: { ids } }).catch(handleProxyError)
    },

    async describe() {
      return vectorizeAPI('/describe').catch(handleProxyError)
    }
  } as Vectorize
}

function handleProxyError(err: H3Error) {
  throw createError({
    statusCode: err.statusCode,
    // @ts-expect-error not aware of data property
    message: err.data?.message || err.message
  })
}
