import { requireNuxtHubFeature } from '../../../utils/features'
import type { HubKV } from '@nuxthub/core'
import { useStorage } from '#imports'

/**
 * Access the Key-Value storage.
 *
 * @example ```ts
 * const kv = hubKV()
 * await kv.set('key', 'value')
 * ```
 *
 * @see https://hub.nuxt.com/docs/features/kv
 */
export function hubKV(): HubKV {
  requireNuxtHubFeature('kv')
  return useStorage('kv')
}
