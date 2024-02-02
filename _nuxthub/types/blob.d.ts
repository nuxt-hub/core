declare interface BlobObject {
  pathname: string
  contentType: string | undefined
  size: number
  uploadedAt: Date
}

declare interface BlobListOptions {
  /**
   * The maximum number of blobs to return per request.
   * @default 1000
   */
  limit?: number
  prefix?: string
  cursor?: string
}
