import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  return {
    storage: {
      blob: config.hub.blob,
      database: config.hub.database,
      kv: config.hub.kv
    },
    features: {
      cache: config.hub.cache
    }
  }
})
