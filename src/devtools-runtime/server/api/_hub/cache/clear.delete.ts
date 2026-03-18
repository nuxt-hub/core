import { eventHandler, getRequestURL } from 'h3'
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
  const cache = useStorage('cache')

  const baseRoute = '/api/_hub/cache/clear/'
  const urlPath = getRequestURL(event).pathname
  const raw = urlPath.startsWith(baseRoute) ? urlPath.slice(baseRoute.length) : ''
  const base = safeDecodeURIComponent(raw.replace(/^\/+/, ''))

  if (!base) {
    await cache.clear()
    return { cleared: true }
  }

  const keys = await cache.getKeys(base)
  await Promise.all(keys.map(k => cache.removeItem(k).catch(() => undefined)))
  return { cleared: true, deleted: keys.length }
})
