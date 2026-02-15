import type { BlobStorage } from '@nuxthub/core/blob'

/**
 * The Blob storage instance.
 *
 * @example ```ts
 * import { blob } from '@nuxthub/blob'
 *
 * const { blobs } = await blob.list()
 * await blob.put('my-file.txt', 'Hello World')
 * ```
 *
 * @see https://hub.nuxt.com/docs/blob
 */
export const blob: BlobStorage

/**
 * Ensure the blob is valid and meets the specified requirements.
 * Will throw an error if the blob does not meet the requirements.
 *
 * @example ```ts
 * import { ensureBlob } from '@nuxthub/blob'
 *
 * ensureBlob(file, { maxSize: '1MB', types: ['image']})
 * ```
 *
 * @see https://hub.nuxt.com/docs/blob/usage#validation
 */
export { ensureBlob } from '@nuxthub/core/blob'
