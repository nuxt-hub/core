import { ofetch } from 'ofetch'
import { joinURL } from 'ufo'
import { createError } from 'h3'
import type { H3Error } from 'h3'
import type { Ai, AutoRAG, AutoRagSearchRequest, AutoRagSearchResponse } from '@cloudflare/workers-types/experimental'
import { requireNuxtHubFeature } from '../../../utils/features'
import { getCloudflareAccessHeaders } from '../../../utils/cloudflareAccess'
import { requireNuxtHubLinkedProject } from '../../../utils/auth'
import { useRuntimeConfig } from '#imports'

let _autorag: AutoRAG

/**
 * Access AutoRAG
 *
 * @example ```ts
 * const autorag = hubAutoRAG('<index-name>')
 * await autorag.aiSearch()
 * ```
 *
 * @see https://hub.nuxt.com/docs/features/autorag
 */
export function hubAutoRAG(instance: string): AutoRAG {
  requireNuxtHubFeature('ai')

  if (_autorag) {
    return _autorag
  }
  const hub = useRuntimeConfig().hub
  // @ts-expect-error globalThis.__env__ is not defined
  const aiBinding: Ai | undefined = process.env.AI || globalThis.__env__?.AI || globalThis.AI

  if (hub.remote && hub.projectUrl && !aiBinding) {
    const cfAccessHeaders = getCloudflareAccessHeaders(hub.cloudflareAccess)
    _autorag = proxyHubAutoRAG(instance, hub.projectUrl, hub.projectSecretKey || hub.userToken, cfAccessHeaders)
  } else if (import.meta.dev) {
    // Mock _autorag to call NuxtHub Admin API to proxy CF account & API token
    _autorag = {
      async aiSearch(params: AutoRagSearchRequest & { stream?: boolean }) {
        requireNuxtHubLinkedProject(hub, 'hubAutoRAG')
        return $fetch(`/api/projects/${hub.projectKey}/ai/autorag/${instance}/ai-search`, {
          baseURL: hub.url,
          method: 'POST',
          headers: {
            authorization: `Bearer ${hub.userToken}`
          },
          body: params,
          responseType: params?.stream ? 'stream' : undefined
        }).catch(handleProxyError)
      },
      async search(params: AutoRagSearchRequest) {
        requireNuxtHubLinkedProject(hub, 'hubAutoRAG')
        return $fetch(`/api/projects/${hub.projectKey}/ai/autorag/${instance}/search`, {
          baseURL: hub.url,
          method: 'POST',
          headers: {
            authorization: `Bearer ${hub.userToken}`
          },
          body: params
        }).catch(handleProxyError)
      }
    } as AutoRAG
  } else if (aiBinding) {
    _autorag = aiBinding.autorag(instance) as AutoRAG
  }
  if (!_autorag) {
    throw createError('Missing Cloudflare AI binding (AI)')
  }
  return _autorag
}

/**
 * Access remote AutoRAG.
 *
 * @param instance The AutoRAG instance name (e.g. `my-instance`)
 * @param projectUrl The project URL (e.g. https://my-deployed-project.nuxt.dev)
 * @param secretKey The secret key to authenticate to the remote endpoint
 * @param headers The headers to send with the request to the remote endpoint
 *
 * @example ```ts
 * const autorag = proxyHubAutoRAG('https://my-deployed-project.nuxt.dev', 'my-secret-key')
 * await autorag.aiSearch({})
 * ```
 *
 * @see https://developers.cloudflare.com/autorag/usage/workers-binding/
 */
export function proxyHubAutoRAG(instance: string, projectUrl: string, secretKey?: string, headers?: HeadersInit): AutoRAG {
  requireNuxtHubFeature('ai')

  const autoragAPI = ofetch.create({
    baseURL: joinURL(projectUrl, `/api/_hub/ai/autorag/${instance}`),
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...headers
    }
  })
  return {
    async aiSearch(params: AutoRagSearchRequest & { stream?: boolean }): Promise<AutoRagSearchResponse> {
      return autoragAPI('/ai-search', {
        body: params,
        responseType: params?.stream ? 'stream' : undefined
      }).catch(handleProxyError)
    },
    async search(params: AutoRagSearchRequest) {
      return autoragAPI('/search', {
        body: params
      }).catch(handleProxyError)
    }
  } as AutoRAG
}

async function handleProxyError(err: H3Error) {
  // If the error is a 403, it means the user token does not have the permission to run the model
  if (import.meta.dev && err.statusCode === 403) {
    console.warn('It seems that your Cloudflare API token does not have the `AutoRAG` permission.\nOpen `https://dash.cloudflare.com/profile/api-tokens` and edit your NuxtHub token.\nAdd the `Account > AutoRAG > Edit` permission to your token and save it.')
  }
  let data = err.data as any
  if (!err.data && typeof (err as any).response?.json === 'function') {
    data = (await (err as any).response.json())?.data || {}
  }
  throw createError({
    statusCode: data?.statusCode || err.statusCode,
    statusMessage: data?.statusMessage || err.statusMessage,
    message: data?.message || err.message,
    data
  })
}
