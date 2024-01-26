import type { H3Event } from 'h3'
import type { R2Bucket } from '@cloudflare/workers-types/experimental'

const _buckets: Record<string, R2Bucket> = {}

export function useBucket (event: H3Event, name: string = '') {
  const bucketName = name ? `BUCKET_${name.toUpperCase()}` : 'BUCKET'
  if (_buckets[bucketName]) {
    return _buckets[bucketName]
  }

  // TODO: move to globalThis.__env__ or process.env
  const cfEnv = event.context.cloudflare?.env
  if (!cfEnv) {
    console.log(event.context.cloudflare)
    throw createError('Missing Cloudflare env')
  }
  if (!cfEnv[bucketName]) {
    throw createError(`Missing Cloudflare R2 binding ${bucketName}`)
  }
  _buckets[bucketName] = cfEnv[bucketName] as R2Bucket

  return _buckets[bucketName]
}
