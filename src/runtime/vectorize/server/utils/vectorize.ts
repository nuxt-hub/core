import { createError } from 'h3'
import type { VectorizeIndex } from '@nuxthub/core'
import { requireNuxtHubFeature } from '../../../utils/features'

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
 * @see https://developers.cloudflare.com/vectorize/reference/client-api/
 */
export function hubVectorize(): VectorizeIndex {
  requireNuxtHubFeature('vectorize')

  if (_vectorize) {
    return _vectorize
  }
  // @ts-expect-error globalThis.__env__ is not defined
  const binding = process.env.VECTORIZE || globalThis.__env__?.VECTORIZE || globalThis.VECTORIZE
  if (binding) {
    _vectorize = binding as VectorizeIndex
    return _vectorize
  }
  throw createError('Missing Cloudflare DB binding (Vectorize)')
}
