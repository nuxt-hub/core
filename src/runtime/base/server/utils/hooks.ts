import { createHooks } from 'hookable'
import { useRuntimeConfig } from '#imports'

export interface HubHooks {
  'bindings:ready': () => void
  'database:migrations:done': () => void
}

/**
 * Access Hub lifecycle hooks.
 *
 * @example ```ts
 * hubHooks.hook('bindings:ready', () => {
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
export function onHubReady(cb: HubHooks['bindings:ready']) {
  if (import.meta.dev) {
    const hub = useRuntimeConfig().hub
    if (hub.database) return hubHooks.hookOnce('database:migrations:done', cb)
    return hubHooks.hookOnce('bindings:ready', cb)
  }
  cb()
}
