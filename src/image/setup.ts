import type { Nuxt } from '@nuxt/schema'
import type { HubConfig, ResolvedBlobConfig } from '@nuxthub/core'
import { resolvePath } from '@nuxt/kit'
import { defu } from 'defu'
import { resolve, logWhenReady } from '../utils'

export async function setupImage(nuxt: Nuxt, hub: HubConfig, deps: Record<string, string>) {
  if (!hub.blob) return

  const blobConfig = hub.blob as ResolvedBlobConfig
  const imagePath = blobConfig.image?.path
  if (!imagePath) return

  const imageVersion = deps['@nuxt/image']
  if (!imageVersion) {
    logWhenReady(nuxt, 'Install @nuxt/image v2+ to enable NuxtHub image optimization', 'warn')
    return
  }

  // Check if @nuxt/image v2+ by trying to resolve runtime path (v1 doesn't export it)
  try {
    await resolvePath('@nuxt/image/runtime')
  } catch {
    logWhenReady(nuxt, '@nuxt/image v2+ is required for NuxtHub integration. Please upgrade to @nuxt/image@^2.0.0', 'warn')
    return
  }

  const normalizedPath = (imagePath.startsWith('/') ? imagePath : `/${imagePath}`)
    .replace(/\/+$/, '') || '/'

  // Register nuxthub provider for @nuxt/image
  // @ts-expect-error image options from @nuxt/image
  nuxt.options.image ||= {}
  // @ts-expect-error image options from @nuxt/image
  nuxt.options.image.providers ||= {}

  // Respect any existing user config while ensuring required defaults.
  // @ts-expect-error image options from @nuxt/image
  const existingProvider = nuxt.options.image.providers.nuxthub as any | undefined
  const providerPath = resolve('image/runtime/provider')

  // If user configured a different provider under the "nuxthub" key, respect it.
  const isCustomProvider = existingProvider?.provider && existingProvider.provider !== providerPath
  if (!isCustomProvider) {
    // @ts-expect-error image options from @nuxt/image
    nuxt.options.image.providers.nuxthub = defu(existingProvider || {}, {
      provider: providerPath,
      options: { driver: blobConfig.driver, path: normalizedPath }
    })
  }

  // Set as default provider if not already set
  // @ts-expect-error image options from @nuxt/image
  if (!nuxt.options.image.provider || nuxt.options.image.provider === 'auto') {
    // @ts-expect-error image options from @nuxt/image
    nuxt.options.image.provider = 'nuxthub'
  }

  logWhenReady(nuxt, `\`@nuxt/image\` nuxthub provider registered (${blobConfig.driver})`)
}
