import { useRuntimeConfig } from '#imports'
import { createHooks } from 'hookable'

export interface HubHooks {
  'bindings:ready': () => any | void
}

/**
 * Access Hub lifecycle hooks.
 *
 * @example ```ts
 * hubHooks.on('bindings:ready', () => {
 *   console.log('Bindings are ready!')
 * })
 * ```
 * @see https://hub.nuxt.com/docs/recipes/hooks#hubhooks
 */
export const hubHooks = createHooks<HubHooks>()

/**
 * Run a callback when the NuxtHub environment bindings are set up.
 * @param cb The callback to run
 * @example ```ts
 * onHubReady(() => {
 *   console.log('Bindings are ready!')
 * })
 * ```
 * @see https://hub.nuxt.com/docs/recipes/hooks#onhubready
 */
export function onHubReady (cb: HubHooks['bindings:ready']) {
  const hub = useRuntimeConfig().hub
  if (import.meta.dev && !hub.remote) {
    return hubHooks.hookOnce('bindings:ready', cb)
  }
  cb()
}
