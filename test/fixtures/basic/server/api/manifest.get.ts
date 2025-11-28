import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  return {
    storage: {
      blob: config.hub.blob,
      db: config.hub.db,
      kv: config.hub.kv
    },
    features: {
      cache: config.hub.cache
    }
  }
})
