import { createError } from 'h3'
import type { Ai, AiOptions, ConversionResponse } from '@cloudflare/workers-types/experimental'
import { requireNuxtHubFeature } from '../../../utils/features'
// import { requireNuxtHubLinkedProject } from '../../../utils/auth'
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
    // Mock _ai to call NuxtHub Admin API to proxy CF account & API token
    _ai = {
      async run(model: string, params?: Record<string, unknown>, options?: AiOptions) {
        // requireNuxtHubLinkedProject(hub, 'hubAI')
        // return $fetch(`/api/projects/${hub.projectKey}/ai/run`, {
        //   baseURL: hub.url,
        //   method: 'POST',
        //   headers: {
        //     authorization: `Bearer ${hub.userToken}`
        //   },
        //   body: { model, params, options },
        //   responseType: params?.stream ? 'stream' : undefined
        // }).catch(handleProxyError)
      },
      async models(params?: Record<string, unknown>) {
        // requireNuxtHubLinkedProject(hub, 'hubAI')
        // return $fetch(`/api/projects/${hub.projectKey}/ai/models`, {
        //   baseURL: hub.url,
        //   method: 'POST',
        //   headers: {
        //     authorization: `Bearer ${hub.userToken}`
        //   },
        //   body: { params }
        // }).catch(handleProxyError)
      },
      async toMarkdown(_files: unknown, _options: unknown): Promise<ConversionResponse[]> {
        throw createError({
          statusCode: 501,
          message: 'hubAI().toMarkdown() is only supported with remote storage in development mode.'
        })
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
