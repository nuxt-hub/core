import type { Nuxt } from '@nuxt/schema'
import { logger, createResolver } from '@nuxt/kit'

const log = logger.withTag('nuxt:hub')

export function logWhenReady(nuxt: Nuxt, message: string, type: 'info' | 'warn' | 'error' = 'info') {
  if (nuxt.options._prepare) {
    return
  }
  if (nuxt.options.dev) {
    nuxt.hooks.hookOnce('modules:done', () => {
      log[type](message)
    })
  } else {
    log[type](message)
  }
}

export const { resolve, resolvePath } = createResolver(import.meta.url)
