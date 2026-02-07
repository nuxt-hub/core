import { defineEventHandler, useRuntimeConfig } from '#imports'

export default defineEventHandler(async () => {
  const hub = useRuntimeConfig().hub
  if (!hub?.blob) {
    return { disabled: true }
  }

  const hubBlobId = 'hub:' + 'blob'
  const { blob } = await import(/* @vite-ignore */ hubBlobId)
  return blob.list({ limit: 5 })
})
