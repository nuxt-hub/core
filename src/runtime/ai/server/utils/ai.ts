import { createError } from 'h3'
import type { Ai } from '@nuxthub/core'
import { requireNuxtHubFeature } from '../../../utils/features'

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
  // @ts-expect-error globalThis.__env__ is not defined
  const binding = process.env.AI || globalThis.__env__?.AI || globalThis.AI
  if (binding) {
    _ai = binding as Ai
    return _ai
  }
  throw createError('Missing Cloudflare DB binding (AI)')
}
