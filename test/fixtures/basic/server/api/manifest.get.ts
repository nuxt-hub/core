import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'

export default defineEventHandler(async (event) => {
  return useRuntimeConfig(event).hub
})
