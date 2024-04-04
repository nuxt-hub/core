import { useRuntimeConfig } from '#imports'
import { createError } from 'h3'

const featureMessages = {
  analytics: [
    'Nuxt Hub Analytics is not enabled, set `hub.analytics = true` in your `nuxt.config.ts`'
  ].join('\n'),
  blob: [
    'Nuxt Hub Blob is not enabled, set `hub.blob = true` in your `nuxt.config.ts`',
    'You might neet to subscribe to the Cloudflare\'s R2 Storage plan before enabling Blob.',
    'Read more at https://hub.nuxt.com/docs/storage/blob'
  ].join('\n'),
  cache: [
    'Nuxt Hub Cache is not enabled, set `hub.cache = true` in your `nuxt.config.ts`'
  ].join('\n'),
  database: [
    'Nuxt Hub Database is not enabled, set `hub.database = true` in your `nuxt.config.ts`',
    'Read more at https://hub.nuxt.com/docs/storage/database'
  ].join('\n'),
  kv: [
    'Nuxt Hub KV is not enabled, set `hub.kv = true` in your `nuxt.config.ts`',
    'Read more at https://hub.nuxt.com/docs/storage/kv'
  ].join('\n'),
}

export function requireNuxtHubFeature(feature: keyof typeof featureMessages) {
  const hub = useRuntimeConfig().hub

  if (!hub[feature]) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Unprocessable Entity',
      data: {
        reason: featureMessages[feature]
      }
    })
  }
}