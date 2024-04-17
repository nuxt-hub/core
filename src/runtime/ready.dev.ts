import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { hubHooks } from './server/utils/hooks'

export default defineNitroPlugin(async () => {
  // Wait for nitro-cloudflare-dev to be ready
  // @ts-except-error globalThis.__env__ not yet typed
  await globalThis.__env__
  await hubHooks.callHookParallel('bindings:ready')
})
