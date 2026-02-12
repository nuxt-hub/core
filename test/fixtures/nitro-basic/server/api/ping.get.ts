import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const { kv } = await import('hub:kv')

  await kv.set('nitro:ping', { ok: true })
  const value = await kv.get('nitro:ping')

  return { ok: true, value }
})
