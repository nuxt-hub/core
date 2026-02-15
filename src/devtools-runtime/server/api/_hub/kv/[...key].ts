import { eventHandler, getHeader, readBody, sendNoContent, createError, getRequestURL } from 'h3'
import { kv } from 'hub:kv'
import { handleCors } from '../../../utils/cors'

function safeDecodeURIComponent(input: string) {
  try {
    return decodeURIComponent(input)
  } catch {
    return input
  }
}

function toStorageKey(pathParam: string) {
  // Keep compatibility with unstorage-style prefixes while preventing raw `/` keys
  // from becoming filesystem paths in local development drivers.
  return safeDecodeURIComponent(pathParam).replace(/\//g, ':')
}

export default eventHandler(async (event) => {
  if (handleCors(event)) return

  const method = event.method
  const baseRoute = '/api/_hub/kv/'
  const urlPath = getRequestURL(event).pathname
  const raw = urlPath.startsWith(baseRoute) ? urlPath.slice(baseRoute.length) : ''
  const keyParam = raw.replace(/^\/+/, '')

  // `unstorage/drivers/http` lists keys with a trailing `/:`.
  if (method === 'GET' && (keyParam === '' || keyParam === ':' || keyParam.endsWith('/:'))) {
    const base = (keyParam === '' || keyParam === ':')
      ? ''
      : keyParam.slice(0, -2) // remove `/:`
    const prefix = toStorageKey(base)
    return kv.keys(prefix)
  }

  const key = toStorageKey(keyParam)
  if (!key) throw createError({ statusCode: 400, message: 'Key is required' })

  if (method === 'HEAD') {
    const value = await kv.get(key)
    if (value === null || value === undefined) throw createError({ statusCode: 404, message: 'Key not found' })
    return sendNoContent(event)
  }

  if (method === 'GET') {
    const value = await kv.get(key)
    if (value === null || value === undefined) throw createError({ statusCode: 404, message: 'Key not found' })
    return value
  }

  if (method === 'PUT') {
    const ttlHeader = getHeader(event, 'x-ttl')
    const ttl = ttlHeader ? Number.parseInt(ttlHeader, 10) : undefined
    const body = await readBody(event)
    await kv.set(key, body, ttl ? { ttl } : undefined)
    return 'OK'
  }

  if (method === 'DELETE') {
    await kv.del(key)
    return 'OK'
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
