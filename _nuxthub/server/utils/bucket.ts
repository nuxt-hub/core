import type { R2Bucket } from '@cloudflare/workers-types/experimental'

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
