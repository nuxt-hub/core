import { eventHandler, getRouterParam, readBody, createError } from 'h3'
import { kv } from 'hub:kv'
import { handleCors } from '../../utils/cors'

export default eventHandler(async (event) => {
  if (handleCors(event)) return
  const method = event.method
  const key = decodeURIComponent(getRouterParam(event, 'key') || '')
  if (!key) throw createError({ statusCode: 400, message: 'Key is required' })

  if (method === 'GET') {
    const value = await kv.get(key)
    if (value === null) throw createError({ statusCode: 404, message: 'Key not found' })
    return { key, value }
  }

  if (method === 'PUT') {
    const body = await readBody(event)
    const { value, ttl } = body
    await kv.set(key, value, ttl ? { ttl } : undefined)
    return { key, value }
  }

  if (method === 'DELETE') {
    await kv.del(key)
    return { key, deleted: true }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
