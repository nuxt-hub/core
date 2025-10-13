import { mkdir } from 'node:fs/promises'
import { join } from 'pathe'

import type { Nuxt } from '@nuxt/schema'
import type { HubConfig } from '../features'
import { addDevToolsCustomTabs } from '../utils/devtools'

export async function setupBase(nuxt: Nuxt, hub: HubConfig) {
  // Create the hub.dir directory
  hub.dir = join(nuxt.options.rootDir, hub.dir!)
  try {
    await mkdir(hub.dir, { recursive: true })
  } catch (e: any) {
    if (e.errno === -17) {
      // File already exists
    } else {
      throw e
    }
  }

  // Add custom tabs to Nuxt DevTools
  if (nuxt.options.dev) {
    addDevToolsCustomTabs(nuxt, hub)
  }

  // Remove trailing slash for prerender routes
  nuxt.options.nitro.prerender ||= {}
  nuxt.options.nitro.prerender.autoSubfolderIndex ||= false
}
