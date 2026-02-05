import { defineEventHandler, useRuntimeConfig, useStorage } from '#imports'

export default defineEventHandler(async () => {
  const hub = useRuntimeConfig().hub
  if (!hub?.cache) {
    return { disabled: true }
  }

  const storage = useStorage('cache')
  await storage.setItem('hub:cache:test', { value: 'ok', at: Date.now() })

  return {
    cached: await storage.getItem('hub:cache:test')
  }
})
