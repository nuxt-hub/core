import { eventHandler, getRouterParam, createError } from 'h3'
import { useStorage } from 'nitropack/runtime'

export default eventHandler(async (event) => {
  const method = event.method
  const key = decodeURIComponent(getRouterParam(event, 'key') || '')
  if (!key) throw createError({ statusCode: 400, message: 'Key is required' })
  const cache = useStorage('cache')

  if (method === 'GET') {
    const value = await cache.getItem(key)
    return { key, value }
  }

  if (method === 'DELETE') {
    await cache.removeItem(key)
    return { key, deleted: true }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
