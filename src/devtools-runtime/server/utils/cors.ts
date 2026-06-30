import { getHeader, sendNoContent, setHeader } from 'h3'
import type { H3Event } from 'h3'

function isAllowedOrigin(origin: string) {
  if (origin === 'https://hub.nuxt.com') return true
  if (/^https:\/\/[a-z0-9-]+\.hub\.nuxt\.com$/i.test(origin)) return true
  if (/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin)) return true
  return false
}

/**
 * Applies CORS headers for hosted-UI -> localhost calls.
 * Returns true if request was handled as a preflight (OPTIONS).
 */
export function handleCors(event: H3Event) {
  const origin = getHeader(event, 'origin')
  if (origin && isAllowedOrigin(origin)) {
    setHeader(event, 'access-control-allow-origin', origin)
    setHeader(event, 'vary', 'origin')
  }

  // Private Network Access preflights (Chrome).
  if (getHeader(event, 'access-control-request-private-network') === 'true') {
    setHeader(event, 'access-control-allow-private-network', 'true')
  }

  if (event.method === 'OPTIONS') {
    const requestedMethod = getHeader(event, 'access-control-request-method')
    const requestedHeaders = getHeader(event, 'access-control-request-headers')
    setHeader(event, 'access-control-allow-methods', requestedMethod || 'GET,POST,PUT,DELETE,HEAD,OPTIONS')
    setHeader(event, 'access-control-allow-headers', requestedHeaders || 'content-type,x-ttl,x-nuxthub-file-content-type')
    setHeader(event, 'access-control-max-age', '600')
    sendNoContent(event)
    return true
  }

  return false
}
