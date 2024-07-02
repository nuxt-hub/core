import { ofetch } from 'ofetch'
import { joinURL } from 'ufo'
import { createError } from 'h3'
import type { H3Error } from 'h3'
import type { Ai } from '../../../../types/ai'
import { requireNuxtHubFeature } from '../../../utils/features'
import { useRuntimeConfig } from '#imports'

let _ai: Ai

/**
 * Access Workers AI
 *
 * @example ```ts
 * const ai = hubAi()
 * await ai.run('@cf/meta/llama-3-8b-instruct', {
 *   prompt: "What is the origin of the phrase 'Hello, World'"
 * })
 * ```
 *
 * @see https://developers.cloudflare.com/workers-ai/configuration/bindings/#methods
 */
export function hubAi(): Ai {
  requireNuxtHubFeature('ai')

  if (_ai) {
    return _ai
  }
  const hub = useRuntimeConfig().hub
  // @ts-expect-error globalThis.__env__ is not defined
  const binding = process.env.AI || globalThis.__env__?.AI || globalThis.AI
  if (hub.remote && hub.projectUrl && !binding) {
    _ai = proxyHubAi(hub.projectUrl, hub.projectSecretKey || hub.userToken)
    return _ai
  }
  if (binding) {
    _ai = binding as Ai
    return _ai
  }
  throw createError('Missing Cloudflare AI binding (AI)')
}

/**
 * Access remote Workers AI.
 *
 * @param projectUrl The project URL (e.g. https://my-deployed-project.nuxt.dev)
 * @param secretKey The secret key to authenticate to the remote endpoint
 *
 * @example ```ts
 * const ai = proxyHubAi('https://my-deployed-project.nuxt.dev', 'my-secret-key')
 * await ai.run('@cf/meta/llama-3-8b-instruct', {
 *   prompt: "What is the origin of the phrase 'Hello, World'"
 * })
 * ```
 *
 * @see https://developers.cloudflare.com/workers-ai/configuration/bindings/#methods
 */
export function proxyHubAi(projectUrl: string, secretKey?: string): Ai {
  requireNuxtHubFeature('ai')

  const aiAPI = ofetch.create({
    baseURL: joinURL(projectUrl, '/api/_hub/ai'),
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`
    }
  })
  return {
    async run(model: string, params?: Record<string, unknown>) {
      return aiAPI('/run', { body: { model, params } }).catch(handleProxyError)
    }
  } as Ai
}

function handleProxyError(err: H3Error) {
  throw createError({
    statusCode: err.statusCode,
    // @ts-expect-error not aware of data property
    message: err.data?.message || err.message
  })
}
