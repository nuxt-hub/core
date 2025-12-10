import type { H3Event } from 'h3'
import type { BlobMultipartOptions, BlobMultipartUpload, BlobObject, BlobListOptions, BlobListResult, BlobPutOptions, HandleMPUResponse } from '../../types'

export type BlobPutBody = string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob | File

/**
 * Custom blob driver interface - replaces unstorage driver
 * Provides direct access to underlying storage services for proper list, getMeta, etc. support
 */
export interface BlobDriver<TOptions> {
  /**
   * The name of the driver (e.g., 'cloudflare-r2', 'fs', 's3', 'vercel-blob')
   */
  name: string

  /**
   * Driver-specific options
   */
  options: TOptions

  /**
   * List all blobs with proper metadata support
   */
  list(options?: BlobListOptions): Promise<BlobListResult>

  /**
   * Get blob content as a Blob
   */
  get(pathname: string): Promise<Blob | null>

  /**
   * Get blob content as ArrayBuffer (for serving)
   */
  getArrayBuffer(pathname: string): Promise<ArrayBuffer | null>

  /**
   * Put a blob into storage
   */
  put(pathname: string, body: BlobPutBody, options?: BlobPutOptions): Promise<BlobObject>

  /**
   * Get blob metadata without content
   */
  head(pathname: string): Promise<BlobObject | null>

  /**
   * Check if blob exists
   */
  hasItem(pathname: string): Promise<boolean>

  /**
   * Delete blob(s)
   */
  delete(pathnames: string | string[]): Promise<void>

  /**
   * Create a multipart upload
   */
  createMultipartUpload(pathname: string, options?: BlobMultipartOptions): Promise<BlobMultipartUpload>

  /**
   * Resume a multipart upload
   */
  resumeMultipartUpload(pathname: string, uploadId: string): Promise<BlobMultipartUpload>

  /**
   * Optional: Custom handler for multipart uploads (e.g., Vercel Blob client-side uploads)
   * If provided, this will be used instead of the generic multipart upload handler
   */
  handleMultipartUpload?(event: H3Event, options?: BlobMultipartOptions): Promise<HandleMPUResponse>
}
