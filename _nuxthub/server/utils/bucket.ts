import type { R2Bucket, R2ListOptions } from '@cloudflare/workers-types/experimental'
import mime from 'mime'
import { imageMeta } from 'image-meta'
import { defu } from 'defu'

const _buckets: Record<string, R2Bucket> = {}

export function useBucket (name: string = '') {
  const bucketName = name ? `BUCKET_${name.toUpperCase()}` : 'BUCKET'
  if (_buckets[bucketName]) {
    return _buckets[bucketName]
  }

  if (process.env.NUXT_HUB_URL) {
    console.log('Using R2 local (proxy for useBucket() is not yet supported)')
  }
  // @ts-ignore
  const binding = process.env[bucketName] || globalThis.__env__?.[bucketName] || globalThis[bucketName]
  if (!binding) {
    throw createError(`Missing Cloudflare R2 binding ${bucketName}`)
  }
  _buckets[bucketName] = binding as R2Bucket

  return _buckets[bucketName]
}

export async function serveFiles (bucket: R2Bucket, options: R2ListOptions = {}) {
  const resolvedOptions = defu(options, {
    limit: 500,
    include: ['httpMetadata' as const, 'customMetadata' as const],
  })

  // https://developers.cloudflare.com/r2/api/workers/workers-api-reference/#r2listoptions
  const listed = await bucket.list(resolvedOptions)
  let truncated = listed.truncated
  let cursor = listed.truncated ? listed.cursor : undefined

  while (truncated) {
    const next = await bucket.list({
      ...options,
      cursor: cursor,
    })
    listed.objects.push(...next.objects)

    truncated = next.truncated
    cursor = next.truncated ? next.cursor : undefined
  }

  return listed.objects
}

export function getContentType (pathOrExtension?: string) {
  return (pathOrExtension && mime.getType(pathOrExtension)) || 'application/octet-stream'
}

export function getExtension (type?: string) {
  return (type && mime.getExtension(type)) || ''
}

export function getMetadata (type: string, buffer: Buffer) {
  if (type.startsWith('image/')) {
    return imageMeta(buffer) as Record<string, any>
  } else {
    return {}
  }
}

export function toArrayBuffer (buffer: Buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length)
  const view = new Uint8Array(arrayBuffer)
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i]
  }
  return arrayBuffer
}
