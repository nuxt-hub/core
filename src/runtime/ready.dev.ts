import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { hubHooks } from './base/server/utils/hooks'

export default defineNitroPlugin(async () => {
  // Wait for nitro-cloudflare-dev to be ready
  // @ts-except-error globalThis.__env__ not yet typed
  await (globalThis as any).__env__
  await hubHooks.callHookParallel('bindings:ready')
})
