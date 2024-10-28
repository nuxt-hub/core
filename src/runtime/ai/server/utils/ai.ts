import { ofetch } from 'ofetch'
import { joinURL } from 'ufo'
import { createError } from 'h3'
import type { H3Error } from 'h3'
import type { Ai } from '@cloudflare/workers-types/experimental'
import { requireNuxtHubFeature } from '../../../utils/features'
import { getCloudflareAccessHeaders } from '../../../utils/cloudflareAccess'
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
 */
export function hubAI(): Ai {
  requireNuxtHubFeature('ai')

  if (_ai) {
    return _ai
  }
  const hub = useRuntimeConfig().hub
  // @ts-expect-error globalThis.__env__ is not defined
  const binding = process.env.AI || globalThis.__env__?.AI || globalThis.AI
  if (hub.remote && hub.projectUrl && !binding) {
    const cfAccessHeaders = getCloudflareAccessHeaders(hub.cloudflareAccess)
    _ai = proxyHubAI(hub.projectUrl, hub.projectSecretKey || hub.userToken)
  } else if (import.meta.dev) {
    // Mock _ai to call NuxtHub Admin API to proxy CF account & API token
    _ai = {
      async run(model: string, params?: Record<string, unknown>) {
        if (!hub.projectKey) {
          throw createError({
            statusCode: 500,
            message: 'Missing hub.projectKey variable to use hubAI()'
          })
        }
        if (!hub.userToken) {
          throw createError({
            statusCode: 500,
            message: 'Missing hub.userToken variable to use hubAI()'
          })
        }
        return $fetch(`/api/projects/${hub.projectKey}/ai/run`, {
          baseURL: hub.url,
          method: 'POST',
          headers: {
            authorization: `Bearer ${hub.userToken}`
          },
          body: { model, params },
          responseType: params?.stream ? 'stream' : undefined
        }).catch(handleProxyError)
      }
    } as Ai
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
    async run(model: string, params?: Record<string, unknown>) {
      return aiAPI('/run', {
        body: { model, params },
        responseType: params?.stream ? 'stream' : undefined
      }).catch(handleProxyError)
    }
  } as Ai
}

async function handleProxyError(err: H3Error) {
  // If the error is a 403, it means the user token does not have the permission to run the model
  if (import.meta.dev && err.statusCode === 403) {
    console.warn('It seems that your Cloudflare API token does not have the `Worker AI` permission.\nOpen `https://dash.cloudflare.com/profile/api-tokens` and edit your NuxtHub token.\nAdd the `Account > Worker AI > Read` permission to your token and save it.')
  }
  throw createError({
    statusCode: err.statusCode,
    // @ts-expect-error not aware of data property
    message: err.data?.message || err.message
  })
}
