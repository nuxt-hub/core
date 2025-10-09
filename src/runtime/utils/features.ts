import { createError } from 'h3'
import { useRuntimeConfig } from '#imports'

const featureMessages = {
  ai: [
    'NuxtHub AI is not enabled, set `hub.ai` in your `nuxt.config.ts`',
    'Read more at `https://hub.nuxt.com/docs/features/ai`'
  ].join('\n'),
  blob: [
    'NuxtHub Blob is not enabled, set `hub.blob = true` in your `nuxt.config.ts`',
    'Read more at `https://hub.nuxt.com/docs/features/blob`'
  ].join('\n'),
  cache: [
    'NuxtHub Cache is not enabled, set `hub.cache = true` in your `nuxt.config.ts`'
  ].join('\n'),
  database: [
    'NuxtHub Database is not enabled, set `hub.database = true` in your `nuxt.config.ts`',
    'Read more at `https://hub.nuxt.com/docs/features/database`'
  ].join('\n'),
  kv: [
    'NuxtHub KV is not enabled, set `hub.kv = true` in your `nuxt.config.ts`',
    'Read more at `https://hub.nuxt.com/docs/features/kv`'
  ].join('\n')
}

export function requireNuxtHubFeature(feature: keyof typeof featureMessages) {
  const hub = useRuntimeConfig().hub

  if (!hub[feature]) {
    if (import.meta.dev) {
      console.error(featureMessages[feature])
    }
    throw createError({
      statusCode: 422,
      statusMessage: 'Unprocessable Entity',
      message: featureMessages[feature]
    })
  }
}
