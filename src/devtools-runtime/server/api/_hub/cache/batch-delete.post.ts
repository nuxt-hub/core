import { eventHandler, readBody, createError } from 'h3'
import { useStorage } from 'nitropack/runtime'
import { handleCors } from '../../../utils/cors'

export default eventHandler(async (event) => {
  if (handleCors(event)) return
  const body = await readBody(event)
  const keys = body?.keys
  if (!Array.isArray(keys) || keys.some(k => typeof k !== 'string')) {
    throw createError({ statusCode: 400, message: 'Expected body: { keys: string[] }' })
  }
  const cache = useStorage('cache')
  await Promise.all(keys.map(k => cache.removeItem(k).catch(() => undefined)))
  return { deleted: keys.length }
})
