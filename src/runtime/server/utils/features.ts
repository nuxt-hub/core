import { useRuntimeConfig } from '#imports'
import { createError } from 'h3'

const featureMessages = {
  analytics: [
    'NuxtHub Analytics is not enabled, set `hub.analytics = true` in your `nuxt.config.ts`'
  ].join('\n'),
  blob: [
    'NuxtHub Blob is not enabled, set `hub.blob = true` in your `nuxt.config.ts`',
    'Read more at `https://hub.nuxt.com/docs/storage/blob`'
  ].join('\n'),
  cache: [
    'NuxtHub Cache is not enabled, set `hub.cache = true` in your `nuxt.config.ts`'
  ].join('\n'),
  database: [
    'NuxtHub Database is not enabled, set `hub.database = true` in your `nuxt.config.ts`',
    'Read more at `https://hub.nuxt.com/docs/storage/database`'
  ].join('\n'),
  kv: [
    'NuxtHub KV is not enabled, set `hub.kv = true` in your `nuxt.config.ts`',
    'Read more at `https://hub.nuxt.com/docs/storage/kv`'
  ].join('\n'),
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

  if (hub.remote && !hub.remoteManifest?.features?.[feature] && !hub.remoteManifest?.storage?.[feature]) {
    const message = `NuxtHub \`${feature}\` is not enabled in the remote project. Deploy a new version with \`${feature}\` enabled and try again.\nRead more at \`https://hub.nuxt.com/docs/getting-started/remote-storage\``
    if (import.meta.dev) {
      console.error(message)
    }
    throw createError({
      statusCode: 422,
      statusMessage: 'Unprocessable Entity',
      message
    })
  }
}
