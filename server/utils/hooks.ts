import { createHooks } from 'hookable'

export interface HubHooks {
  'bindings:ready': () => any | void
  'auth:provider': (provider: string, result: { user: any, tokens: any }, sessionData: any) => any | void
}

export const hubHooks = createHooks<HubHooks>()

export function onHubReady (cb: HubHooks['bindings:ready']) {
  if (import.meta.dev && !process.env.NUXT_HUB_URL) {
    return hubHooks.hookOnce('bindings:ready', cb)
  }
  cb()
}
