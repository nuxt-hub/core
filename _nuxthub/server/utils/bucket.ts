import type { R2Bucket, R2ListOptions, ReadableStreamDefaultReader } from '@cloudflare/workers-types/experimental'
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

export function getContentType (key: string) {
  return mime.getType(key) || 'application/octet-stream'
}

export function getMetadata (type: string, buffer: Buffer) {
  if (type.startsWith('image/')) {
    return imageMeta(buffer) as Record<string, any>
  } else {
    return {}
  }
}

export async function processStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): Promise<Uint8Array> {
  let { value, done } = await reader.read()

  const results: Array<Uint8Array> = []

  while (!done && value) {
    const newRead = await reader.read()

    results.push(value)

    value = newRead.value
    done = newRead.done
  }

  const result = new Uint8Array(
    // total size
    results.reduce((acc, value) => acc + value.length, 0)
  )

  // Create a new array with total length and merge all source arrays.
  let offset = 0
  results.forEach((item) => {
    result.set(item, offset)
    offset += item.length
  })

  return result
}
