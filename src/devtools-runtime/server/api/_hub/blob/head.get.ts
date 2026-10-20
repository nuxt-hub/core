import { eventHandler, getRequestURL } from 'h3'
import { blob } from 'hub:blob'
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
  const baseRoute = '/api/_hub/blob/head/'
  const urlPath = getRequestURL(event).pathname
  const raw = urlPath.startsWith(baseRoute) ? urlPath.slice(baseRoute.length) : ''
  const pathname = safeDecodeURIComponent(raw.replace(/^\/+/, ''))
  return blob.head(pathname)
})
