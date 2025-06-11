import { createStorage } from 'unstorage'
import httpDriver from 'unstorage/drivers/http'
import cloudflareKVBindingDriver from 'unstorage/drivers/cloudflare-kv-binding'
import { joinURL } from 'ufo'
import { createError } from 'h3'
import { requireNuxtHubFeature } from '../../../utils/features'
import { getCloudflareAccessHeaders } from '../../../utils/cloudflareAccess'
import type { HubKV } from '@nuxthub/core'
import { useRuntimeConfig } from '#imports'

let _kv: HubKV

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

  if (_kv) {
    return _kv
  }
  const hub = useRuntimeConfig().hub
  // @ts-expect-error globalThis.__env__ is not defined
  const binding = process.env.KV || globalThis.__env__?.KV || globalThis.KV
  if (hub.remote && hub.projectUrl && !binding) {
    const cfAccessHeaders = getCloudflareAccessHeaders(hub.cloudflareAccess)
    _kv = proxyHubKV(hub.projectUrl, hub.projectSecretKey || hub.userToken, cfAccessHeaders)
    return _kv
  }
  if (binding) {
    _kv = createStorage({
      driver: cloudflareKVBindingDriver({
        binding
      })
    })

    return _kv
  }
  throw createError('Missing Cloudflare KV binding (KV)')
}

/**
 * Access the remote Key-Value storage.
 *
 * @param projectUrl The project URL (e.g. https://my-deployed-project.nuxt.dev)
 * @param secretKey The secret key to authenticate to the remote endpoint
 * @param headers The headers to send with the request to the remote endpoint
 *
 * @example ```ts
 * const kv = proxyHubKV('https://my-deployed-project.nuxt.dev', 'my-secret-key')
 * await kv.set('key', 'value')
 * ```
 *
 * @see https://hub.nuxt.com/docs/features/kv
 */
export function proxyHubKV(projectUrl: string, secretKey?: string, headers?: Record<string, string>): HubKV {
  requireNuxtHubFeature('kv')

  const storage = createStorage({
    driver: httpDriver({
      base: joinURL(projectUrl, '/api/_hub/kv/'),
      headers: {
        Authorization: `Bearer ${secretKey}`,
        ...headers
      }
    })
  })

  return storage
}
