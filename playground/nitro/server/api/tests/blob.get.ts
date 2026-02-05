import { defineEventHandler, useRuntimeConfig } from '#imports'

export default defineEventHandler(async () => {
  const hub = useRuntimeConfig().hub
  if (!hub?.blob) {
    return { disabled: true }
  }

  const { blob } = await import('hub:blob')
  return blob.list({ limit: 5 })
})
