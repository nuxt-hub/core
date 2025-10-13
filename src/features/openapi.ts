import type { Nuxt } from '@nuxt/schema'
import type { HubConfig } from '../features'

export function setupOpenAPI(nuxt: Nuxt, _hub: HubConfig) {
  // Enable Nitro database
  nuxt.options.nitro.experimental ||= {}
  nuxt.options.nitro.experimental.openAPI ??= true
}
