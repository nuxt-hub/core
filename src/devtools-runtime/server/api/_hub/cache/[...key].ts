import { eventHandler, createError, sendNoContent, getRequestURL } from 'h3'
import { useStorage } from 'nitropack/runtime'
import { handleCors } from '../../../utils/cors'

function safeDecodeURIComponent(input: string) {
  try {
    return decodeURIComponent(input)
  } catch {
    return input
  }
}

export default eventHandler(async (event) => {
  if (handleCors(event)) return

  const method = event.method
  const baseRoute = '/api/_hub/cache/'
  const urlPath = getRequestURL(event).pathname
  const raw = urlPath.startsWith(baseRoute) ? urlPath.slice(baseRoute.length) : ''
  const key = safeDecodeURIComponent(raw.replace(/^\/+/, ''))
  if (!key) throw createError({ statusCode: 400, message: 'Key is required' })

  const cache = useStorage('cache')

  if (method === 'HEAD') {
    const value = await cache.getItem(key)
    if (value === null || value === undefined) throw createError({ statusCode: 404, message: 'Key not found' })
    return sendNoContent(event)
  }

  if (method === 'GET') {
    const value = await cache.getItem(key)
    return value
  }

  if (method === 'DELETE') {
    await cache.removeItem(key)
    return 'OK'
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
