import { defineEventHandler, useRuntimeConfig } from '#imports'

export default defineEventHandler(async () => {
  const hub = useRuntimeConfig().hub
  if (!hub?.kv) {
    return { disabled: true }
  }

  const { kv } = await import('hub:kv')

  await kv.set('framework:nuxt', { year: 2016 })
  await kv.set('framework:vue', { year: 2014 })

  return {
    keys: await kv.keys('framework:')
  }
})
