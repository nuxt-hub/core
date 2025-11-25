import { ofetch } from 'ofetch'
import { joinURL } from 'ufo'
import { createError } from 'h3'
import type { H3Error } from 'h3'
import type { Ai, AiOptions, ConversionResponse } from '@cloudflare/workers-types/experimental'
import { requireNuxtHubFeature } from '../../../utils/features'
import { getCloudflareAccessHeaders } from '../../../utils/cloudflareAccess'
import { requireNuxtHubLinkedProject } from '../../../utils/auth'
import { createCloudflareAI } from './cloudflare'
import { useRuntimeConfig } from '#imports'

let _ai: Ai

/**
 * Access Workers AI
 *
 * @example ```ts
 * const ai = hubAI()
 * await ai.run('@cf/meta/llama-3.1-8b-instruct', {
 *   prompt: "What is the origin of the phrase 'Hello, World'"
 * })
 * ```
 *
 * @see https://hub.nuxt.com/docs/features/ai
 * @deprecated See https://hub.nuxt.com/docs/features/ai#migration-guide for more information.
 */
export function hubAI(): Omit<Ai, 'autorag' | 'gateway'> {
  requireNuxtHubFeature('ai')

  if (_ai) {
    return _ai
  }
  const hub = useRuntimeConfig().hub
  // @ts-expect-error globalThis.__env__ is not defined
  const binding = process.env.AI || globalThis.__env__?.AI || globalThis.AI
  if (hub.remote && hub.projectUrl && !binding) {
    const cfAccessHeaders = getCloudflareAccessHeaders(hub.cloudflareAccess)
    _ai = proxyHubAI(hub.projectUrl, hub.projectSecretKey || hub.userToken, cfAccessHeaders)
  } else if (import.meta.dev) {
    // If Cloudflare credentials are provided, use direct API calls
    if (hub.cloudflare.accountId && hub.cloudflare.apiToken) {
      // @ts-expect-error cloudflare is not defined in HubConfig yet
      _ai = createCloudflareAI(hub.cloudflare.accountId, hub.cloudflare.apiToken)
    } else {
      // Fallback: Mock _ai to call NuxtHub Admin API to proxy CF account & API token
      _ai = {
        async run(model: string, params?: Record<string, unknown>, options?: AiOptions) {
          requireNuxtHubLinkedProject(hub, 'hubAI')
          return $fetch(`/api/projects/${hub.projectKey}/ai/run`, {
            baseURL: hub.url,
            method: 'POST',
            headers: {
              authorization: `Bearer ${hub.userToken}`
            },
            body: { model, params, options },
            responseType: params?.stream ? 'stream' : undefined
          }).catch(handleProxyError)
        },
        async models(params?: Record<string, unknown>) {
          requireNuxtHubLinkedProject(hub, 'hubAI')
          return $fetch(`/api/projects/${hub.projectKey}/ai/models`, {
            baseURL: hub.url,
            method: 'POST',
            headers: {
              authorization: `Bearer ${hub.userToken}`
            },
            body: { params }
          }).catch(handleProxyError)
        },
        async toMarkdown(_files: unknown, _options: unknown): Promise<ConversionResponse[]> {
          throw createError({
            statusCode: 501,
            message: 'hubAI().toMarkdown() is only supported with remote storage in development mode.'
          })
        }
      } as Ai
    }
  } else if (binding) {
    _ai = binding as Ai
  }
  if (!_ai) {
    throw createError('Missing Cloudflare AI binding (AI)')
  }
  return _ai
}

/**
 * Access remote Workers AI.
 *
 * @param projectUrl The project URL (e.g. https://my-deployed-project.nuxt.dev)
 * @param secretKey The secret key to authenticate to the remote endpoint
 * @param headers The headers to send with the request to the remote endpoint
 *
 * @example ```ts
 * const ai = proxyHubAI('https://my-deployed-project.nuxt.dev', 'my-secret-key')
 * await ai.run('@cf/meta/llama-3.1-8b-instruct', {
 *   prompt: "What is the origin of the phrase 'Hello, World'"
 * })
 * ```
 *
 * @see https://developers.cloudflare.com/workers-ai/configuration/bindings/#methods
 */
export function proxyHubAI(projectUrl: string, secretKey?: string, headers?: HeadersInit): Ai {
  requireNuxtHubFeature('ai')

  const aiAPI = ofetch.create({
    baseURL: joinURL(projectUrl, '/api/_hub/ai'),
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...headers
    }
  })
  return {
    async run(model: string, params?: Record<string, unknown>, options?: AiOptions) {
      return aiAPI('/run', {
        body: { model, params, options },
        responseType: params?.stream ? 'stream' : undefined
      }).catch(handleProxyError)
    },
    async models(params?: Record<string, unknown>) {
      return aiAPI('/models', {
        body: { params }
      }).catch(handleProxyError)
    },
    async toMarkdown(files: unknown, options: unknown): Promise<ConversionResponse[]> {
      return aiAPI('/to-markdown', {
        body: { files, options }
      }).catch(handleProxyError)
    }
  } as Ai
}

async function handleProxyError(err: H3Error) {
  // If the error is a 403, it means the user token does not have the permission to run the model
  if (import.meta.dev && err.statusCode === 403) {
    console.warn('It seems that your Cloudflare API token does not have the `Worker AI` permission.\nOpen `https://dash.cloudflare.com/profile/api-tokens` and edit your NuxtHub token.\nAdd the `Account > Worker AI > Read` permission to your token and save it.')
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
