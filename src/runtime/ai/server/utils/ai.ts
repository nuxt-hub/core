import { createGateway, type GatewayProvider } from '@ai-sdk/gateway'
import { createWorkersAI, type WorkersAI } from 'workers-ai-provider'

import { useRuntimeConfig } from '#imports'
import { requireNuxtHubFeature } from '../../../utils/features'
import type { NuxtHubAIProvider } from '#build/types/nuxthub-ai'

let _ai: WorkersAI | GatewayProvider

type NuxtHubAI = NuxtHubAIProvider

type HubAIProvider<T extends NuxtHubAI>
  = T extends 'vercel' ? GatewayProvider
    : T extends 'cloudflare' ? WorkersAI
      : WorkersAI | GatewayProvider

/**
 * Access the configured AI SDK provider
 *
 * @example ```ts
 * import { streamText } from 'ai';
 * const result = streamText({
 *   model: hubAI('mistral/mistral-medium'),
 *   prompt: 'Who created Nuxt?',
 * });
 * ```
 *
 * @see https://hub.nuxt.com/docs/features/ai
 * @deprecated See https://hub.nuxt.com/docs/features/ai#migration-guide for more information.
 */
export function hubAI<T extends NuxtHubAI = NuxtHubAI>(model: Parameters<HubAIProvider<T>>[0]): Omit<ReturnType<HubAIProvider<T>>, 'config' | 'getArgs'> {
  requireNuxtHubFeature('ai')

  if (_ai) {
    return (_ai as HubAIProvider<T>)(model) as Omit<ReturnType<HubAIProvider<T>>, 'config' | 'getArgs'>
  }

  const hub = useRuntimeConfig().hub
  if (hub.ai === 'vercel') {
    const isGatewayApiKeySet = process.env.AI_GATEWAY_API_KEY
    _ai = createGateway(isGatewayApiKeySet
      ? { apiKey: process.env.AI_GATEWAY_API_KEY }
      : undefined)
  }

  if (hub.ai === 'cloudflare') {
    const isAiBindingSet = !!(process.env.AI as { runtime: string } | undefined)?.runtime
    _ai = createWorkersAI(isAiBindingSet
      ? { binding: 'AI' }
      : {
          accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
          apiKey: process.env.CLOUDFLARE_API_KEY!
        })
  }

  return (_ai as HubAIProvider<T>)(model) as Omit<ReturnType<HubAIProvider<T>>, 'config' | 'getArgs'>
}
