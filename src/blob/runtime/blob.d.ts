import type { BlobStorage } from '@nuxthub/core/blob'

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
}
