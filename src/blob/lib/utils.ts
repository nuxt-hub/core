import mime from 'mime'
import { createError } from 'h3'

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/

/**
 * Reject pathnames that could escape the storage root or change the request target:
 * empty pathnames (unless allowed), control characters, and `.` or `..` segments (split on `/` and `\`).
 */
export function assertValidPathname(pathname: string, { allowEmpty = false } = {}): string {
  if (
    typeof pathname !== 'string'
    || (!allowEmpty && !pathname.replace(/^\/+/, ''))
    || CONTROL_CHARS_RE.test(pathname)
    || pathname.split(/[/\\]/).some(segment => segment === '.' || segment === '..')
  ) {
    throw createError({ statusCode: 400, message: 'Invalid blob pathname' })
  }
  return pathname
}

/**
 * Decode a URL-encoded pathname once, then validate it.
 */
export function decodePathname(pathname: string, options?: { allowEmpty?: boolean }): string {
  let decoded: string
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid blob pathname' })
  }
  return assertValidPathname(decoded, options)
}

export async function streamToArrayBuffer(stream: ReadableStream, streamSize: number) {
  const result = new Uint8Array(streamSize)
  let bytesRead = 0
  const reader = stream.getReader()

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    result.set(value, bytesRead)
    bytesRead += value.length
  }
  return result
}

export function getContentType(pathOrExtension?: string) {
  return (pathOrExtension && mime.getType(pathOrExtension)) || 'application/octet-stream'
}
