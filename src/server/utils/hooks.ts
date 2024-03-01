import { useRuntimeConfig } from '#imports'
import { createHooks } from 'hookable'

export interface HubHooks {
  'bindings:ready': () => any | void
}

export const hubHooks = createHooks<HubHooks>()

export function onHubReady (cb: HubHooks['bindings:ready']) {
  const hub = useRuntimeConfig().hub
  if (import.meta.dev && !hub.remote) {
    return hubHooks.hookOnce('bindings:ready', cb)
  }
  cb()
}
