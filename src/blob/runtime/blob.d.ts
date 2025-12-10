import type { BlobStorage, BlobEnsureOptions } from '@nuxthub/core/blob'

declare module 'hub:blob' {
  /**
   * The Blob storage instance.
   *
   * @example ```ts
   * import { blob } from 'hub:blob'
   *
   * const { blobs } = await blob.list()
   * await blob.put('my-file.txt', 'Hello World')
   * ```
   *
   * @see https://hub.nuxt.com/docs/features/blob
   */
  export const blob: BlobStorage
  /**
   * Ensure the blob is valid and meets the specified requirements.
   * Will throw an error if the blob does not meet the requirements.
   *
   * @example ```ts
   * import { ensureBlob } from 'hub:blob'
   *
   * ensureBlob(file, { maxSize: '1MB', types: ['image']})
   * ```
   *
   * @see https://hub.nuxt.com/docs/features/blob#ensureblob
   */
  export const ensureBlob: (blob: Blob, options: BlobEnsureOptions) => void
}
