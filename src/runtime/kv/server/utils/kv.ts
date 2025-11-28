import type { HubKV } from '@nuxthub/core'
import { useStorage } from 'nitropack/runtime'

/**
 * Access the Key-Value storage.
 *
 * @example ```ts
 * await kv.set('key', 'value')
 * ```
 *
 * @see https://hub.nuxt.com/docs/features/kv
 */
export const kv = useStorage('kv') as HubKV
