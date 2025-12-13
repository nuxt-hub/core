import { joinURL } from 'ufo'
import { defineProvider } from '@nuxt/image/runtime'
import cloudflareProvider from '@nuxt/image/runtime/providers/cloudflare'
import vercelProvider from '@nuxt/image/runtime/providers/vercel'

const cfProvider = cloudflareProvider()
const vercelProviderInstance = vercelProvider()

export function getImage(
  src: string,
  {
    modifiers = {},
    baseURL,
    driver,
    path
  }: {
    modifiers?: Record<string, any>
    baseURL?: string
    driver?: string
    path?: string
  } = {},
  ctx?: any
) {
  const hasProtocol = /^[a-z][a-z0-9+.-]*:/.test(src)
  const isAbsolute = hasProtocol || src.startsWith('/')
  const passThroughBase = path || baseURL || '/'
  const resolvedSrc = isAbsolute ? src : joinURL(passThroughBase, src)

  // Dev: pass-through (no optimization available locally)
  if (import.meta.dev) {
    return { url: resolvedSrc }
  }

  const safeCtx = ctx || { options: { screens: {}, domains: [] } }

  // Cloudflare R2 -> CF Image Resizing
  if (driver === 'cloudflare-r2') {
    return cfProvider.getImage(resolvedSrc, { modifiers, baseURL }, safeCtx)
  }

  // Vercel Blob -> Vercel Image Optimization
  if (driver === 'vercel-blob') {
    return vercelProviderInstance.getImage(resolvedSrc, { modifiers, baseURL }, safeCtx)
  }

  // S3/FS or fallback: no optimization, pass-through
  return { url: resolvedSrc }
}

export default defineProvider({ getImage })
