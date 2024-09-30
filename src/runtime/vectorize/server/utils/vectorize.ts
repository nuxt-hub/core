import { ofetch } from 'ofetch'
import { joinURL } from 'ufo'
import { createError } from 'h3'
import type { H3Error } from 'h3'
import type { RuntimeConfig } from 'nuxt/schema'
import type { Vectorize } from '../../../../types/vectorize'
import { requireNuxtHubFeature } from '../../../utils/features'
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
 * Vectorize is currently only supported with `--remote`. See https://developers.cloudflare.com/workers/testing/local-development/#supported-resource-bindings-in-different-environments for details.
 *
 * @see https://hub.nuxt.com/docs/features/vectorize
 */
export function hubVectorize(index: VectorizeIndexes): Vectorize {
  // todo: autosuggest indexes for hubVectorize based on what's set in nuxt.config.ts.hub.vectorize[index]
  requireNuxtHubFeature('vectorize')

  if (_vectorize[index]) {
    return _vectorize[index]
  }

  const hub = useRuntimeConfig().hub
  const bindingName = `VECTORIZE_${index.toUpperCase()}`

  // @ts-expect-error globalThis.__env__ is not defined
  const binding = process.env[bindingName] || globalThis.__env__?.[bindingName] || globalThis[bindingName]
  if (hub.remote && hub.projectUrl && !binding) {
    _vectorize[index] = proxyHubVectorize(index, hub.projectUrl, hub.projectSecretKey || hub.userToken)
    return _vectorize[index]
  }
  if (binding) {
    _vectorize[index] = binding as Vectorize
    return _vectorize[index]
  }
  throw createError(`Missing Cloudflare Vectorize binding (${bindingName})`)
}

/**
 * Access the remote Vectorize database.
 *
 * @param index The Vectorize index to access
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
export function proxyHubVectorize(index: VectorizeIndexes, projectUrl: string, secretKey?: string): Vectorize {
  requireNuxtHubFeature('vectorize')

  const vectorizeAPI = ofetch.create({
    baseURL: joinURL(projectUrl, `/api/_hub/vectorize/${index}`),
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
