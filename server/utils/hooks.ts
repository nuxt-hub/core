import { createHooks } from 'hookable'

export interface HubHooks {
  'bindings:ready': () => any | void
}

export const hubHooks = createHooks<HubHooks>()

export function onHubReady (cb: HubHooks['bindings:ready']) {
  if (import.meta.dev) {
    return hubHooks.hookOnce('bindings:ready', cb)
  }
  cb()
}
